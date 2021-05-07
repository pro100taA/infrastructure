const BaseResponseAuth = require('./BaseResponseAuth.js');

class AuthLogin extends BaseResponseAuth {
    constructor(channel, data, resData) {
        super(data);
        this.channel = channel;
        this.resData = resData;
    }
}

module.exports = AuthLogin;
