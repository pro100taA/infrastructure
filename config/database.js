({
    name: 'default',
    type: 'postgres',
    host: 'postgres',
    port: 5432,

    username: 'default',
    password: 'secret',
    database: 'postgres',

    synchronize: false,

    entities: [ 'schema/*.js' ]
});
