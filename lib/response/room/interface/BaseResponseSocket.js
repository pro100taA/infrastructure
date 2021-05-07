const BaseResponse = require('../../BaseResponse');

class BaseResponseSocket extends BaseResponse {
    constructor(data, event, userId, exclude) {
        super();

        this.userId = userId;
        this.event = event;
        this.data = data;
        this.exclude = exclude;
    }

    toJSON() {
        return { ...this.data };
    }
}

module.exports = BaseResponseSocket;
