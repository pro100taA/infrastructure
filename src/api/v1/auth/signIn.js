({
    access: '*',
    methods: [ 'POST' ],
    handle: async (id) => {
        const val = await domain.post.useCase.create(id);

        return val || null;
    }
});
