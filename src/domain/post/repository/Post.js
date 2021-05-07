(() => {
    const repository = db.pool.getRepository("Post");

    return {
        getId: async id => repository.findOne(id)
    }
});