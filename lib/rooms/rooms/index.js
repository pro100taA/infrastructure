const rooms = new Map();

const joinTo = (name, userId) => {
    const room = rooms.get(rooms) || new Set();

    room.add(userId);
    rooms.set(name, room);

    return true;
};

const leaveTo = (name, userId) => {
    const room = rooms.get(rooms) || new Set();

    room.delete(userId);
    rooms.set(name, room);

    return true;
};

const getUsers = (name) => rooms.get(name);

module.exports = {
    joinTo,
    leaveTo,
    getUsers
};
