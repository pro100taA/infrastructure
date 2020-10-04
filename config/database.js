({
    name: 'default',
    type: 'postgres',
    host: 'localhost',
    port: 5432,

    username: 'default',
    password: 'secret',
    database: 'nodejs',

    synchronize: false,
    logging: false,

    entities: [
        'src/domain/*/entity/model/*.js',
        'src/domain/*/entity/schema/*.js'
    ],

    subscribers: [
        'src/subscriber/*.js'
    ],

    migrations: [
        'src/migration/*.js'
    ],

    cli: {
        migrationsDir: 'src/migration',
        subscribersDir: 'src/subscriber'
    }
});