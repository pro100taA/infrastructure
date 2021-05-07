const users = new Map();

const getUserId = session => session.data.user.id;

const appendToGroup = session => {
    const userId = getUserId(session);
    const group = users.get(userId) || new Set();

    group.add(session);
    users.set(userId, group);

    return userId;
};

const removeToGroup = session => {
    const userId = getUserId(session);
    const group = users.get(userId) || new Set();

    group.delete(session);

    return true;
};

const getConnectionsToUser = (name) => users.get(name);

module.exports = {
    getConnectionsToUser,
    appendToGroup,
    removeToGroup,
    getUserId
};
