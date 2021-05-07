module.exports = (db) => ({
    getUser: async () => {
        const { pool } = db;

        return ({
            id: 1
        });
    },
    getUserId: async () => {
        const { pool } = db;

        return ({
            id: 1
        });
    }
});
