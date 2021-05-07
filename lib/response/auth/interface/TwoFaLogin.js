const BaseResponseAuth = require('./BaseResponseAuth.js');

class TwoFaLogin extends BaseResponseAuth {
    constructor(channel, data, resData) {
        super(data);
        this.channel = channel;
        this.resData = resData;
    }
}

module.exports = TwoFaLogin;
