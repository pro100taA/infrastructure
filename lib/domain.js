'use strict';

const typeORM = require('typeorm');

const { node } = require('./dependencies.js');
const { path, vm, fsp } = node;

const SCRIPT_OPTIONS = { timeout: 5000 };

class Domain {

    constructor(path, DI) {
        this.domain = {
            entity: {},
            repository: {},
            util: {},
            service: {},
            useCase: {}
        };

        this.domainPath = path;

        this.createSandbox(DI);

        this.load(path);

        Object.freeze(this);

        return this.domain;
    }

    createSandbox({ domain: domains, ...other }) {

        const sandbox = {
            Error: this.Error,
            domain: this.domain, typeORM, clearInterval,
            Buffer, setTimeout, clearTimeout,
            setImmediate, setInterval, clearImmediate,
            ...other, domains,
        };

        this.sandbox = vm.createContext(sandbox);
    }

    async createScript(fileName) {
        try {
            const code = await fsp.readFile(fileName, 'utf8');

            if (!code) return null;

            const src = '\'use strict\';\ncontext => ' + code;
            const options = { filename: fileName, lineOffset: -1 };
            const script = new vm.Script(src, options);

            return script.runInContext(this.sandbox, SCRIPT_OPTIONS)();
        } catch (err) {
            if (err.code !== 'ENOENT') {
                this.logger.error(err.stack);
            }

            return null;
        }
    }

    async loadEntity(placePath) {
        const rel = placePath.substring(this.domainPath.length + 1);
        if (!rel.includes('/')) return;

        const [ place, ...entity ] = rel.split('/');

        const [ entityName ] = entity.pop().split('.');

        this.domain[place][entityName] = await this.createScript(placePath);
    }


    async loadUseCase(placePath) {
        const rel = placePath.substring(this.domainPath.length + 1);
        if (!rel.includes('/')) return;

        const [ place, ...entity ] = rel.split('/');

        const [ entityName ] = entity.pop().split('.');

        this.domain[place][entityName] = await this.createScript(placePath);
    }

    async loadModule(placePath) {
        const rel = placePath.substring(this.domainPath.length + 1);
        if (!rel.includes('/')) return;

        const [ place, ...entity ] = rel.split('/');

        const [ entityName ] = entity.pop().split('.');

        this.domain[place][entityName] = await this.createScript(placePath);
    }

    async load(placePath) {
        const files = await fsp.readdir(placePath, { withFileTypes: true });

        for (const file of files) {
            if (file.name.startsWith('.')) continue;

            const filePath = path.join(placePath, file.name);

            if (file.isDirectory()) await this.load(filePath);
            else if (filePath.includes('/entity/')) await this.loadEntity(filePath);
            else if (filePath.includes('/useCase/')) await this.loadUseCase(filePath);
            else await this.loadModule(filePath);
        }
    }
}

Domain.Error = class extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
};


module.exports = Domain;
