const {
    npm: { uuid },
} = require('./../../dependencies.js');

module.exports = (db) => ({
    insert: (token, data) => {
        db.insert('user_sessions', {
            id: uuid.generate(),
            token,
            user_id: data.user.id,
            date_create: new Date().toDateString(),
            date_last_active: new Date().toDateString(),
            data: JSON.stringify(data),
        });
    },

    update: (data, terms) => db.update('user_sessions', data, terms),

    delete: (terms) => db.delete('user_sessions', terms),

    select: (columns, terms) => db.select('user_sessions', columns, terms),
});
