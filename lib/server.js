const { node, npm } = require('./dependencies.js');
const { http, https, worker } = node;
const { common, ws } = npm;

const Semaphore = require('./semaphore.js');
const Rooms = require('./rooms');

const SHUTDOWN_TIMEOUT = 5000;
const SHORT_TIMEOUT = 500;
const LONG_RESPONSE = 30000;

const timeout = msec => new Promise(resolve => {
    setTimeout(resolve, msec);
});

const receiveBody = async req => {
    const buffers = [];
    for await (const chunk of req) {
        buffers.push(chunk);
    }
    return Buffer.concat(buffers).toString();
};

class Server {
    constructor(config, { application, Channel }) {
        this.config = config;
        this.application = application;
        this.Channel = Channel;
        this.channels = new Map();
        this.rooms = Rooms;

        const { host, balancer, protocol, ports, concurrency, queue } = config;
        const { threadId } = worker;

        this.balancer = balancer && threadId === 1;
        const skipBalancer = balancer ? 1 : 0;

        this.port = this.balancer ? balancer : ports[threadId - skipBalancer - 1];

        const transport = protocol === 'http' || this.balancer ? http : https;
        const listener = this.listener.bind(this);
        this.server = transport.createServer({ ...application.cert }, listener);

        this.semaphore = new Semaphore(concurrency, queue.size, queue.timeout);

        this.ws = new ws.Server({ server: this.server });
        this.ws.on('connection', async (connection, req) => {
            const channel = await new Channel(req, null, connection, application, this.rooms);
            connection.on('message', data => {
                channel.message(data);
            });
            connection.on('close', () => {
                this.rooms.disconnect(channel);
            });
        });

        this.protocol = protocol;
        this.host = host;

        this.server.listen(this.port, host);
    }

    async listener(req, res) {
        const { channels, Channel } = this;
        let finished = false;
        const { url, connection } = req;
        const channel = await new Channel(req, res, null, this.application);
        channels.set(connection, channel);

        const timer = setTimeout(() => {
            if (finished) return;
            finished = true;
            channels.delete(connection);
            channel.error(504);
        }, LONG_RESPONSE);

        res.on('close', () => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            channels.delete(connection);
        });

        if (this.balancer) {
            const { protocol, ports } = this.config;
            const host = common.parseHost(protocol, req.headers);
            const port = common.sample(ports);

            channel.redirect(`${common.parseProtocol(protocol)}://${host}:${port}/`);
            return;
        }

        if (url.startsWith('/api')) this.request(channel);
    }

    request(channel) {
        const { req } = channel;
        if (req.method === 'OPTIONS') {
            channel.options();
            return;
        }
        if (req.method !== 'POST') {
          channel.error(403);
          return;
        }
        const body = receiveBody(req);
        if (req.url === '/api') {
            body.then(data => {
                channel.message(data);
            });
        } else {
            body.then(data => {
                const { pathname, searchParams } = new URL('http://' + req.url);
                const [, interfaceName, methodName] = pathname.split('/');
                const args = data ? JSON.parse(data) : Object.fromEntries(searchParams);
                channel.rpc(-1, interfaceName, methodName, args);
            });
        }
        body.catch(err => {
            channel.error(500, err);
        });
    }

    closeChannels() {
        const { channels } = this;
        for (const [connection, channel] of channels.entries()) {
            this.rooms.disconnect(channel);
            channels.delete(connection);
            channel.error(503);
            connection.destroy();
        }
    }

    async close() {
        this.server.close(err => {
            if (err) this.application.logger.error(err.stack);
        });
        if (this.channels.size === 0) {
            await timeout(SHORT_TIMEOUT);
            return;
        }
        await timeout(SHUTDOWN_TIMEOUT);
        this.closeChannels();
    }
}

module.exports = { Server };
