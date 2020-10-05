(async (data) => {
    const repository = domain.repository.Post();

    return await repository.getId(data);
});

