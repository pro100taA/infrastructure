({
    name: 'default',
    type: 'postgres',
    host: 'localhost',
    port: 5432,

    username: 'default',
    password: 'secret',
    database: 'nodejs',

    synchronize: true,

    entities: [
        '../schema/PostSchema.js'
    ]
});
