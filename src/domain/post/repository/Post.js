(() => {
    const repository = db.pool.getRepository("Post");

    return {
        getId: async id => await repository.findOne(id)
    }
});