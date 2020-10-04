async () => {
    setInterval(() => {
        const stats = {};
        context.client.emit('example/resmon', stats);
    }, config.resmon.interval);
    return { subscribed: 'resmon' };
};