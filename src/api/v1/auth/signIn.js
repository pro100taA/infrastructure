({
    access: '*',
    methods: ['POST'],
    handle: ({ a }) => {
        // console.log('info_1231231231231', context, a, application, domain);
        return { val: true };
    }
});
