const { node, npm } = require('./dependencies.js');

const { path, fsp } = node;
const { vm2 } = npm;
const { VM, VMScript } = vm2;

const { domain: DomainErrors } = require('./errors');

class Domain {
    constructor(path, DI, options) {
        this.domain = {
            entity: {},
            repository: {},
            util: {},
            service: {},
            useCase: {},
        };

        this.domainPath = path;

        return this.init(DI, options);
    }

    async init(DI, options) {
        this.createSandbox(DI, options);
        await this.load(this.domainPath);

        Object.freeze(this.domain);

        return this.domain;
    }

    createSandbox({ logger, ...other }, options) {
        const sandbox = {
            Error: DomainErrors,
            object: new Object(),
            func: new Function(),
            Buffer,
            logger,
            ...other,
            ...this.domain,
        };

        this.logger = logger;
        this.sandbox = new VM({ sandbox }, options);
    }

    async createScript(fileName, isRequire) {
        try {
            if (isRequire) {
                return require(fileName);
            }

            const code = await fsp.readFile(fileName, 'utf8');

            if (!code) return null;

            const src = `'use strict';\n() => ${code}`;
            const options = { filename: fileName, lineOffset: -1 };
            const script = new VMScript(src, options);

            return this.sandbox.run(script)();
        } catch (err) {
            console.log(err);

            if (err.code !== 'ENOENT') {
                this.logger.error(err);
            }

            return null;
        }
    }

    async loadScript(region, paths, placePath, isRequire = false) {
        const [name] = paths.pop().split('.');

        let site = region;
        for (const path of paths) {
            site[path] = site[path] || {};
            site = site[path];
        }

        site[name] = await this.createScript(placePath, isRequire);
    }

    async loadEntity(placePath) {
        const rel = placePath.substring(this.domainPath.length + 1);
        if (!rel.includes('/')) return;

        const [place, ...entity] = rel.split('/');
        await this.loadScript(this.domain[place], entity, placePath, true);
    }

    async loadModule(placePath) {
        const rel = placePath.substring(this.domainPath.length + 1);
        if (!rel.includes('/')) return;

        const [place, ...modules] = rel.split('/');
        await this.loadScript(this.domain[place], modules, placePath);
    }

    async load(placePath) {
        const files = await fsp.readdir(placePath, { withFileTypes: true });

        for (const file of files) {
            if (file.name.startsWith('.')) continue;

            const filePath = path.join(placePath, file.name);

            if (file.isDirectory()) await this.load(filePath);
            else if (filePath.includes('/entity/')) await this.loadEntity(filePath);
            else await this.loadModule(filePath);
        }
    }
}

module.exports = Domain;
