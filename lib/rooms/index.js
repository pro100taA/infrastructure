const group = require('./group');
const rooms = require('./rooms');

const getSession = channel => channel.session;

module.exports = {
    appendToGroup: group.appendToGroup,
    removeToGroup: group.removeToGroup,
    getConnectionsToUser(userId) {
        const res = new Set();
        const connections = group.getConnectionsToUser(userId) || [];

        for (const elem of connections) {
            res.add(elem.channel.client);
        }

        return res;
    },

    joinTo(name, userId) {
        return rooms.joinTo(name, userId);
    },

    getConnectionsToRoom(name, exclude = []) {
        const userRooms = rooms.getUsers(name);

        const res = new Set();
        for (const userId of userRooms) {
            if (exclude.includes(userId)) {
                continue;
            }

            const connections = group.getConnectionsToUser(userId) || [];

            for (const elem of connections) {
                res.add(elem.channel.client);
            }
        }

        return res;
    },

    disconnect(channel) {
        const session = getSession(channel);
        if (!session) return;

        return group.removeToGroup(session);
    },

    leaveTo(name, userId) {
        return rooms.leaveTo(name, userId);
    }
};
