const BaseResponseAuth = require('./interface/BaseResponseAuth');
const AuthLogin = require('./interface/AuthLogin');
const AuthLogout = require('./interface/AuthLogout');
const AuthRestore = require('./interface/AuthRestore');
const TwoFaLogin = require('./interface/TwoFaLogin');

const sender = (result) => {
    const channel = result.channel;
    const { data } = result;
    const { session } = channel;

    switch (true) {
        case result instanceof TwoFaLogin:
            data.valid ? session.valid() : session.notValid();
            break;
        case result instanceof AuthLogin:
            channel.client.emit('auth/login', {
                ...data,
                permissions: session.rbac.getMyPermission(),
            });
            break;
    }
};

module.exports = {
    interface: {
        AuthLogin,
        AuthLogout,
        AuthRestore,
        TwoFaLogin,
        login: (channel, data, resData = {}) => new AuthLogin(channel, data, resData),
        logout: (data) => new AuthLogout(data),
    },
    base: BaseResponseAuth,
    sender,
};
