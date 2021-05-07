const Rooms = require('../../rooms');
const SendToRoom = require('./interface/SendToRoom');
const SendToUser = require('./interface/SendToUser');
const BaseResponseSocket = require('./interface/BaseResponseSocket');

const senderRoom = (data) => {
    const clients = Rooms.getConnectionsToRoom(data.room, data.exclude);
    Rooms.joinTo(data.room, data.userId);

    for (const client of clients) {
        client.emit(data.event, data);
    }
};

const senderUser = (data) => {
    const clients = Rooms.getConnectionsToUser(data.recipient);

    for (const client of clients) {
        client.emit(data.event, data);
    }
};

const sender = (data) => {
    switch (true) {
        case data instanceof SendToRoom:
            senderRoom(data);
            break;

        case data instanceof SendToUser:
            senderUser(data);
            break;
    }

};

module.exports = {
    base: BaseResponseSocket,
    interface: {
        SendToRoom,
        SendToUser,
    },
    sender
};
