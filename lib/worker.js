const { node, npm, protect } = require('./dependencies.js');
const { worker, fsp, path, vm } = node;
const {
    common: { parseProtocol },
} = npm;

const application = require('./application.js');

const Config = require('@metarhia/config');
const metalog = require('metalog');
const Database = require('./database.js');
const Mailer = require('./mailer.js');
const Twilio = require('./twilio.js');
const Cloud = require('./cloud');
const { Server } = require('./server.js');
const Channel = require('./channel.js');
const initAuth = require('./auth');
const Stripe = require('./stripe');
const Console = require('./console.js');

(async () => {
    const configPath = path.join(application.pathRoot, 'config');
    const sandbox = vm.createContext({
        require: (path) => `${configPath}/${path}`,
    });

    const options = { mode: process.env.MODE, sandbox };
    const config = await new Config(configPath, options);

    if (config.impress) protect(config.impress, node, npm);

    const logPath = path.join(application.pathRoot, 'log');
    const home = application.path;

    const { threadId } = worker;

    const logger = await metalog({
        path: logPath,
        workerId: threadId,
        ...config.log,
        home,
    });

    const console = new Console(logger);
    Object.assign(application, { config, logger, console });

    const logError = (err) => {
        logger.error(err ? err.stack : 'No exception stack available');
    };

    process.on('uncaughtException', logError);
    process.on('warning', logError);
    process.on('unhandledRejection', logError);

    const certPath = path.join(application.pathRoot, 'cert');
    try {
        const key = await fsp.readFile(path.join(certPath, 'key.pem'));
        const cert = await fsp.readFile(path.join(certPath, 'cert.pem'));
        application.cert = { key, cert };
    } catch {
        if (threadId === 1) logger.error('Can not load TLS certificates');
    }

    application.db = new Database(config.database);

    const { balancer, ports = [] } = config.server;
    const servingThreads = ports.length + (balancer ? 1 : 0);

    if (threadId <= servingThreads) {
        const options = { application, Channel };

        application.server = new Server(config.server, options);
        const { port } = application.server;

        logger.system(`Listen port ${port} in worker ${threadId}`);

        application.auth = initAuth(application.db, application.config);
        application.sandboxInject('auth', application.auth);

        application.mailer = new Mailer(
            config.mailer,
            `${parseProtocol(config.server.protocol)}://${config.sessions.domain}`,
        );
        application.sandboxInject('mailer', application.mailer);

        if (config.cloud) {
            application.cloud = Cloud(config.cloud);
            application.sandboxInject('cloud', application.cloud);
        }

        if (config.stripe) {
            application.stripe = Stripe(config.stripe);
            application.sandboxInject('stripe', application.stripe);
        }

        if (config.twilio) {
            application.twilio = new Twilio(config.twilio);
            application.sandboxInject('twilio', application.twilio);
        }
    }

    await application.init();

    logger.system(`Application started in worker ${threadId}`);

    worker.parentPort.on('message', async (message) => {
        if (message.name === 'stop') {
            if (application.finalization) return;

            logger.system(`Graceful shutdown in worker ${threadId}`);

            try {
                await application.shutdown();
            } catch (e) {
                logger.error(`Error shutdown in worker ${threadId}`);
                console.log(e);
            }

            process.exit(0);
        }
    });
})();
