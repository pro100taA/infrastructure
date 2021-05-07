({
    host: '0.0.0.0',
    balancer: false,
    protocol: 'http',
    ports: [7000],
    timeout: 5000,
    concurrency: 1000,
    queue: {
        size: 2000,
        timeout: 3000,
    },
    workers: {
        pool: 0,
        timeout: 3000,
    }
});
