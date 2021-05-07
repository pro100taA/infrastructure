const {
    node: { http, path },
} = require('./dependencies.js');

const MIME_TYPES = {
    html: 'text/html; charset=UTF-8',
    json: 'application/json; charset=UTF-8',
    js: 'application/javascript; charset=UTF-8',
    css: 'text/css',
    png: 'image/png',
    ico: 'image/x-icon',
    svg: 'image/svg+xml',
};

const HEADERS = {
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Security-Policy': [
        'default-src \'self\' ws:',
        'style-src \'self\' https://fonts.googleapis.com',
        'font-src \'self\' https://fonts.gstatic.com',
    ].join('; '),
};

class Client {
    constructor(connection) {
        this.connection = connection;
    }

    emit(name, data) {
        const packet = { event: 'event', [name]: data };
        this.connection.send(JSON.stringify(packet));
    }
}

class Channel {
    constructor(req, res, connection, application) {
        this.req = req;
        this.res = res;
        this.ip = req.socket.remoteAddress;
        this.connection = connection;
        this.application = application;
        this.client = new Client(connection);
        this.session = null;

        return this.init();
    }

    async init() {
        this.session = await this.application.auth.restore(this);
        return this;
    }

    redirect(location) {
        const { res } = this;
        if (res.headersSent) return;
        res.writeHead(302, { Location: location, ...HEADERS });
        res.end();
    }

    options() {
        const { res } = this;
        if (res.headersSent) return;
        res.writeHead(200, HEADERS);
        res.end();
    }

    error(code, err, callId = err) {
        const {
            req: { url, method },
            res,
            connection,
            ip,
            application,
        } = this;
        const status = http.STATUS_CODES[500];

        if (typeof err === 'number') err = undefined;

        const reason = err ? err.stack : status;
        application.logger.error(`${ip}\t${method}\t${url}\t${code}\t${reason}`);

        // const { Error } = this.application;
        const message = err instanceof Error ? err.message : status;
        const error = { message, code };

        if (connection) {
            connection.send(this.encode(JSON.stringify({ callback: callId, error })));
            return;
        }

        if (res.writableEnded) return;

        res.writeHead(500, { 'Content-Type': MIME_TYPES.json, ...HEADERS });
        res.end(this.encode(JSON.stringify({ error })));
    }

    message(data) {
        let packet;

        try {
            packet = JSON.parse(this.decode(data));
        } catch (err) {
            this.error(500, new Error('JSON parsing error'));
            return;
        }

        const [callType, target, ver] = Object.keys(packet);
        const callId = packet[callType];
        const args = packet[target];
        const version = packet[ver] || '*';

        if (callId && args) {
            const [interfaceName, methodName] = target.split('/');
            this.rpc(callId, version, interfaceName, methodName, args);
            return;
        }

        this.error(500, new Error('Packet structure error'));
    }

    async rpc(callId, ver, iname, methodName, args) {
        const { res, connection, ip, application, session, client } = this;
        const { semaphore } = application.server;
        try {
            await semaphore.enter();
        } catch {
            this.error(504, callId);
            return;
        }

        try {
            const context = session ? session.context : application.auth.anonymous(this, client);
            const proc = application.getMethod(iname, ver, methodName, context);
            if (!proc) {
                this.error(404, callId);
                return;
            }

            const { access = '*' } = proc;
            if (!this.session && !['*', '?', '#'].includes(access)) {
                console.log('access---------', access, proc);
                this.error(403, callId);
                return;
            }

            if (this.session && !this.session.active && !['#'].includes(access)) {
                console.log('access---', access, proc);
                this.error(5000, callId);
                return;
            }

            const result = await proc.handle(args);
            if (result instanceof Error) {
                this.error(500, result, callId);
                return;
            }

            const { response } = application.sandbox;

            const mResult = await this.modifyResult(response, result, session, access, application);

            this.sender(connection, res, callId, mResult);

            const token = this.session ? this.session.token : 'anonymous';
            const record = `${ip}\t${token}\t${iname}/${methodName}`;
            application.logger.access(record);
        } catch (err) {
            this.error(500, err, callId);
        } finally {
            semaphore.leave();
        }
    }

    async modifyResult(response, result, session, access, application) {
        switch (true) {
            case result instanceof response.auth.AuthRestore:
                // eslint-disable-next-line no-case-declarations
                const { data } = result;
                this.session.update(data);
                return data;

            case this.session && ['@'].includes(access) && result instanceof response.auth.AuthLogout:
                application.auth.remove(this, this.session.token);
                result.data.token = this.session.token;
                break;

            case !this.session && ['*', '?'].includes(access) && result instanceof response.auth.AuthLogin:
                result.channel.session = application.auth.start(result.channel, result.data);
                result.data.token = result.channel.session.token;
                break;
        }

        return result;
    }

    async sender(connection, res, callId, result) {
        const { response } = this.application.sandbox;

        const sendResponse = (_result) => {
            const data = this.encode(JSON.stringify({ callback: callId, result: _result }));

            if (connection) {
                connection.send(data);
            } else {
                res.writeHead(200, { 'Content-Type': MIME_TYPES.json, ...HEADERS });
                res.end(data);
            }

            return data;
        };

        switch (true) {
            case result instanceof response.BaseResponse:
                response.send(result);
                sendResponse(result.resData || result);
                break;

            default:
                sendResponse(result);
        }

        if (this.session) {
            this.application.auth.refresh(this.session);
        }
    }
}

module.exports = Channel;
