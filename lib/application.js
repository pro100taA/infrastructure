const { node, npm } = require('./dependencies.js');
const { path, events, vm, fs, fsp } = node;
const { common } = npm;

const response = require('./response');
const Domain = require('./domain.js');

const Errors = require('./errors');

const SCRIPT_OPTIONS = { timeout: 5000 };
const EMPTY_CONTEXT = Object.freeze({});
const MODULE = 2;

class Application extends events.EventEmitter {
    constructor() {
        super();

        this.initialization = false;
        this.finalization = false;
        this.namespaces = ['db'];

        this.api = {};

        this.pathRoot = process.cwd();
        this.path = path.join(this.pathRoot, 'src');
        this.apiPath = path.join(this.path, 'api');
        this.libPath = path.join(this.path, 'lib');
        this.readModelPath = path.join(this.path, 'readModel');
        this.domainPath = path.join(this.path, 'domain');

        this.starts = [];
    }

    async init() {
        this.createSandbox();

        await Promise.allSettled([
            this.loadPlace('api', this.apiPath),

            (async () => {
                await this.loadPlace('lib', this.libPath);
                await this.loadPlace('readModel', this.readModelPath);
                await this.loadPlace('domain', this.domainPath);
            })(),
        ]);

        await Promise.allSettled(this.starts.map(fn => fn()));

        this.starts = null;
        this.initialization = true;
    }

    async shutdown() {
        this.finalization = true;

        await this.stopPlace('domain');
        await this.stopPlace('lib');

        if (this.server) await this.server.close();

        await this.logger.close();
    }

    async stopPlace(name) {
        const place = this.sandbox[name];

        for (const moduleName of Object.keys(place)) {
            const module = place[moduleName];

            if (module.stop) await this.execute(module.stop);
        }
    }

    createSandbox() {
        const { config, namespaces, server: { host, port, protocol } = {} } = this;
        const introspect = async interfaces => this.introspect(interfaces);

        const worker = { id: 'W' + node.worker.threadId.toString() };
        const server = { host, port, protocol };
        const application = { response, introspect, worker, server };
        const api = {};
        const lib = {};
        const readModel = {};
        const domain = {};

        for (const name of namespaces) application[name] = this[name];

        const sandbox = {
            response,
            Error: Errors,
            console: this.console,
            Buffer,
            URL,
            URLSearchParams,
            application,
            readModel,
            node,
            npm,
            api,
            lib,
            domain,
            config,
            setTimeout,
            setImmediate,
            setInterval,
            clearTimeout,
            clearImmediate,
            clearInterval,
        };

        this.sandbox = vm.createContext(sandbox);
    }

    sandboxInject(name, module) {
        this[name] = Object.freeze(module);
        this.namespaces.push(name);
    }

    async createScript(fileName) {
        try {
            const code = await fsp.readFile(fileName, 'utf8');

            if (!code) return null;

            const src = '\'use strict\';\ncontext => ' + code;
            const options = { filename: fileName, lineOffset: -1 };
            const script = new vm.Script(src, options);

            return script.runInContext(this.sandbox, SCRIPT_OPTIONS);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                this.logger.error(err.stack);
            }

            return null;
        }
    }

    getMethod(iname, ver, methodName, context) {
        const iface = this.api[iname];
        if (!iface) return null;

        const version = ver === '*' ? iface.default : ver;
        const methods = iface[version.toString()];
        if (!methods) return null;

        const method = methods[methodName];
        if (!method) return null;

        const exp = method(context);
        return typeof exp === 'object' ? exp : { access: '*', handle: exp };
    }

    async loadMethod(fileName) {
        const rel = fileName.substring(this.apiPath.length + 1);
        if (!rel.includes('/')) return;

        const [ver, interfaceName, methodFile] = rel.split('/');
        if (!methodFile.endsWith('.js')) return;

        const name = path.basename(methodFile, '.js');
        const [iname] = interfaceName.split(':');
        const version = ver;

        const script = await this.createScript(fileName);
        if (!script) return;

        let iface = this.api[iname];
        const { api } = this.sandbox;
        let internalInterface = api[iname];

        if (!iface) {
            this.api[iname] = iface = { default: version };
            api[iname] = internalInterface = {};
        }

        let methods = iface[ver];
        if (!methods) iface[ver] = methods = {};

        methods[name] = script;
        internalInterface[name] = script(EMPTY_CONTEXT);

        if (version > iface.default) iface.default = version;
    }

    async loadModule(fileName) {
        const rel = fileName.substring(this.path.length + 1);
        if (!rel.endsWith('.js')) return;

        const script = await this.createScript(fileName);
        const name = path.basename(rel, '.js');
        const namespaces = rel.split(path.sep);
        const exp = script ? script(EMPTY_CONTEXT) : null;
        const container = typeof exp === 'function' ? { handle: exp } : exp;
        const iface = {};

        namespaces[namespaces.length - 1] = name;

        if (container !== null) {
            const methods = Object.keys(container);

            for (const method of methods) {
                const fn = container[method];

                if (typeof fn === 'function') {
                    container[method] = iface[method] = fn.bind(container);
                }
            }
        }

        let level = this.sandbox[namespaces[0]];
        const last = namespaces.length - 1;

        for (let depth = 1; depth <= last; depth++) {
            const namespace = namespaces[depth];
            const next = depth === last ? iface : level[namespace] || {};

            level[namespace] = next.handle || next;
            level = level[namespace];
        }
    }

    async execute(fn) {
        try {
            await fn();
        } catch (err) {
            this.logger.error(err.stack);
        }
    }

    /**
     * TODO Domain
     */
    async loadDomain(placePath) {
        const domains = await fsp.readdir(placePath, { withFileTypes: true });
        const {
            domain,
            lib,
            node,
            npm,
            application: { db, mailer },
        } = this.sandbox;

        for (const item of domains) {
            if (item.name.startsWith('.')) continue;

            const filePath = path.join(placePath, item.name);
            domain[item.name] = await new Domain(filePath, {
                logger: this.logger,
                console: this.console,
                lib,
                db,
                npm,
                node,
                mailer,
            }, { SCRIPT_OPTIONS });
        }
    }

    async loadPlace(place, placePath) {
        const files = await fsp.readdir(placePath, { withFileTypes: true });

        if (place === 'domain') {
            await this.loadDomain(placePath);
        } else {
            for (const file of files) {
                if (file.name.startsWith('.')) continue;

                const filePath = path.join(placePath, file.name);

                if (file.isDirectory()) await this.loadPlace(place, filePath);
                else if (place === 'api') await this.loadMethod(filePath);
                else await this.loadModule(filePath);
            }
        }
        this.watch(place, placePath);
    }

    watch(place, placePath) {
        fs.watch(placePath, async (event, fileName) => {
            console.log(event, place, placePath);
            if (fileName.startsWith('.')) return;

            const filePath = path.join(placePath, fileName);

            try {
                const stat = await node.fsp.stat(filePath);

                if (stat.isDirectory()) {
                    this.loadPlace(place, filePath);
                    return;
                }
            } catch {
                return;
            }

            if (node.worker.threadId === 1) {
                const relPath = filePath.substring(this.path.length);
                this.logger.debug('Reload: ' + relPath);
            }

            if (place === 'api') this.loadMethod(filePath);
            else if (place === 'domain') await this.loadDomain(filePath);
            else this.loadModule(filePath);
        });
    }

    introspect(interfaces) {
        const intro = {};

        for (const interfaceName of interfaces) {
            const [iname, ver = '*'] = interfaceName.split(':');
            const iface = this.api[iname];
            if (!iface) continue;

            const version = ver === '*' ? iface.default : ver;
            const methods = iface[version.toString()];
            const methodNames = Object.keys(methods);
            const interfaceMethods = intro[iname] = {};

            for (const methodName of methodNames) {
                const exp = methods[methodName](EMPTY_CONTEXT);
                const fn = typeof exp === 'object' ? exp.handle : exp;

                const src = fn.toString();
                const signature = common.between(src, '({', '})');

                if (signature === '') {
                    interfaceMethods[methodName] = [];
                    continue;
                }

                const args = signature.split(',').map(s => s.trim());
                interfaceMethods[methodName] = args;
            }
        }

        return intro;
    }
}

const application = new Application();

module.exports = application;
