const node = {};
const internals = [
    'util',
    'child_process',
    'worker_threads',
    'os',
    'v8',
    'vm',
    'path',
    'url',
    'assert',
    'querystring',
    'string_decoder',
    'perf_hooks',
    'async_hooks',
    'timers',
    'events',
    'stream',
    'fs',
    'crypto',
    'zlib',
    'readline',
    'dns',
    'net',
    'tls',
    'http2',
    'http',
    'https',
    'http2',
    'dgram',
];

for (const name of internals) node[name] = require(name);

node.process = process;
node.childProcess = node['child_process'];
node.StringDecoder = node['string_decoder'];
node.perfHooks = node['perf_hooks'];
node.asyncHooks = node['async_hooks'];
node.worker = node['worker_threads'];
node.fsp = node.fs.promises;
node.mcrypto = {
    ...node['crypto'],
    generateHash(value) {
        return this.createHash('sha256').update(value).digest('hex');
    },
    randomHash() {
        const sold = this.randomInt(-(2 ** 24), 2 ** 24);
        return this.generateHash(`${new Date().getTime()}-${sold}`);
    },
    generatePrivate() {
        const security = this.createECDH('secp521r1');
        security.generateKeys();
        return security;
    },
};
Object.freeze(node);

const common = require('@metarhia/common');

const uuid = require('uuid');
const ramda = require('ramda');

const npm = {
    common: {
        ...common,
        parseProtocol: (p) => (p === 'http' ? 'http' : 'https'),
        parseHost: (protocol, headers) => {
            const key = protocol === 'http2' ? ':authority' : 'host';
            return common.parseHost(headers[key]);
        },
    },
    ws: require('ws'),
    uuid: {
        validate: uuid.validate,
        generate: uuid.v4,
    },
    ramda: {
        ...ramda,
        composeAsync: (...arg) => ramda.composeWith(ramda.andThen, arg),
    },
};

const pkgPath = node.path.join(process.cwd(), 'package.json');
const pkg = require(pkgPath);

const skipDependency = [
    'impress',
    'uuid',
    'twig',
    'ramda',
    'typeorm',
    'nodemailer',
    'nodemailer-mailgun-transport',
    'aws-sdk',
    'azure-storage',
    '@google-cloud/storage',
    'stripe',
    'twilio',
    'filereader',
    'node-fetch',
    'bigchaindb-driver'
];

if (pkg.dependencies) {
    for (const dependency of Object.keys(pkg.dependencies)) {
        if (skipDependency.includes(dependency)) continue;

        npm[dependency] = require(dependency);
    }
}
Object.freeze(npm);

const protect = (config, ...namespaces) => {
    const { dependency } = config;

    for (const namespace of namespaces) {
        const names = Object.keys(namespace);

        for (const name of names) {
            const target = namespace[name];
            const meta = dependency[name];

            if (meta && meta.monkeyPatching === 'allow') continue;
            Object.freeze(target);
        }
    }
};

module.exports = { node, npm, protect };
