({
    host: 'erp.loc',
    balancer: 8000,
    protocol: 'http',
    ports: [8004],
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
