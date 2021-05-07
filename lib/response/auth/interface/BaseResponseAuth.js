const BaseResponseRoom = require('../../BaseResponse');

class BaseResponseAuth extends BaseResponseRoom {
    constructor(data) {
        super();
        this.userId = data.user.id;
        this.data = data;
    }

    toJSON() {
        return { ...this.data };
    }
}

module.exports = BaseResponseAuth;
