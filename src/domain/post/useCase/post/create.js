(async (data) => {
    const repository = domain.repository.Post();

    return repository.getId(data);
});

