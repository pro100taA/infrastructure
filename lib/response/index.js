const auth = require('./auth');
const room = require('./room');
const BaseResponse = require('./BaseResponse');

const send = (data) => {
    switch (true) {
        case data instanceof room.base:
            room.sender(data);
            break;

        case data instanceof auth.base:
            auth.sender(data);
            break;
    }
};

module.exports = {
    auth: auth.interface,
    room: room.interface,
    BaseResponse,
    send
};
