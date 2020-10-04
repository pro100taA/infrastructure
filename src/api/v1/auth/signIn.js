({
    access: '*',
    methods: ['POST'],
    handle: ({ a }) => {
        console.log('info_1231231231231', domain.post, domain.post.useCase.create());
        // ['create.js']();
        return { val: true };
    }
});
