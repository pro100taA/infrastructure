const BaseResponseSocket = require('./BaseResponseSocket');

class SendToRoom extends BaseResponseSocket {
    constructor(data, event, userId, exclude, room) {
        super(data, event, userId, exclude);

        this.room = room;
    }
}

module.exports = SendToRoom;
