const { npm } = require('../../dependencies');
const { ramda } = npm;

const contextHandler = (session) => ({
    get: (data, key) => {
        switch (key) {
            case 'rbac':
                return session.rbac;

            case 'token':
                return session.token;

            case 'channel':
                return session.channel;

            default:
                return Reflect.get(data, key);
        }
    },
    set: (data, key, value) => {
        const res = Reflect.set(data, key, value);
        session.save(session.token, data);

        return res;
    },
});

class Session {
    constructor(token, channel, data, store, rbac) {
        this.token = token;
        this.channel = channel;
        this.channels = new Map([channel]);
        this.data = {};
        this.store = store;

        this.updateContext = (data) => {
            this.data = ramda.mergeDeepWith((l, r) => (r ? r : l), this.data, data);
            this.context = new Proxy(this.data, contextHandler(this));
            this.rbac = rbac(data.user.role);
        };

        this.updateContext(data);
    }

    save() {
        const data = JSON.stringify(this.data);

        this.store.update(
            {
                data,
                date_last_active: new Date().toDateString(),
            },
            {
                token: this.token,
            },
        );
    }

    update(data) {
        this.updateContext(data);
        this.save();
    }
}

const sessions = new Map();

module.exports = (store, rbac) => ({
    start: (token, channel, data) => {
        const session = new Session(token, channel, data, store, rbac);

        sessions.set(token, session);
        store.insert(token, data);

        return session;
    },
    restore: async (token, channel) => {
        let session = null;
        const record = await store.select(['data'], { token });
        if (record && record.data) {
            session = new Session(token, channel, record.data, store, rbac);
            sessions.set(token, session);
        }

        return session;
    },

    remove: (token) => {
        sessions.delete(token);
        store.delete({ token });
    },

    get: (token) => sessions.get(token),
});
