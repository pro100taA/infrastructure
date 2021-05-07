const {
    npm: { common },
} = require('./../dependencies.js');

const Rooms = require('../rooms');

const _store = require('./store');
const _rbac = require('./rbac');
const _sessions = require('./sessions');
const _userProvider = require('./user/Provider');

const TOKEN = 'token';
const EPOCH = 'Thu, 01 Jan 1970 00:00:00 GMT';
const FUTURE = 'Fri, 01 Jan 2100 00:00:00 GMT';
const LOCATION = 'Path=/; Domain';
const COOKIE_DELETE = `${TOKEN}=deleted; Expires=${EPOCH}; ${LOCATION}=`;
const COOKIE_HOST = `Expires=${FUTURE}; ${LOCATION}`;

const cache = new WeakMap();

const parseCookies = (cookie) => {
    const values = {};
    const items = cookie.split(';');

    for (const item of items) {
        const parts = item.split('=');
        const key = parts[0].trim();
        const val = parts[1] || '';
        values[key] = val.trim();
    }

    return values;
};

module.exports = (db, config) => {
    const rbac = _rbac(config.rbac);
    const store = _store(db);
    const sessions = _sessions(store, rbac);
    const userProvider = _userProvider(db);

    const start = (channel, { user, settings }) => {
        const { characters, secret, length } = config.sessions;

        const token = common.generateToken(secret, characters, length);
        const host = common.parseHost(config.server.protocol, channel.req.headers);
        const ip = channel.ip;
        const cookie = `${TOKEN}=${token}; ${COOKIE_HOST}=${host}`;

        const session = sessions.start(token, channel, { user, ip, settings });

        cache.set(channel.req, session);

        if (channel.res) channel.res.setHeader('Set-Cookie', cookie);

        Rooms.appendToGroup(session);

        return session;
    };

    const restore = async (channel) => {
        const cachedSession = cache.get(channel.req);
        if (cachedSession) return cachedSession;

        const { cookie } = channel.req.headers;
        if (!cookie) return null;

        const cookies = parseCookies(cookie);

        const { token } = cookies;
        if (!token) return null;

        const session = await sessions.restore(token, channel);
        if (!session) return null;

        cache.set(channel.req, session);

        Rooms.appendToGroup(session);

        return session;
    };

    const refresh = async (session) => {
        const user = await userProvider.getUserId(session.context.user.id);
        session.update({ user });
        // const session = await sessions.restore(oldSession.token, oldSession.channel);
        // if (!session) return null;
        // Rooms.appendToGroup(session);

        return session;
    };

    const remove = (channel, token) => {
        const host = common.parseHost(config.server.protocol, channel.req.headers);

        channel.res.setHeader('Set-Cookie', COOKIE_DELETE + host);
        Rooms.removeToGroup(sessions.get(token));

        sessions.remove(token);
    };

    const anonymous = (channel, client) => ({
        client,
        ip: channel.req.connection.remoteAddress,
        user: {},
        rbac: rbac('anonymous'),
        channel
    });

    return Object.freeze({
        start,
        remove,
        refresh,
        restore,
        anonymous,
        getUser: userProvider.getUser
    });
};
