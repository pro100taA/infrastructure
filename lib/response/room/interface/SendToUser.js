const BaseResponseSocket = require('./BaseResponseSocket');

class SendToUser extends BaseResponseSocket {
    constructor(data, event, userId, recipient, resData) {
        super(data, event, userId, []);

        this.recipient = recipient;
        this.resData = resData;
    }
}

module.exports = SendToUser;
