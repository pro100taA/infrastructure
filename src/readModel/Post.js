() => {
    const { queryBuilder, one, many, oneRaw } = lib.readModel();

    const columns = ['id', 'title', 'text'];

    const selectColumns = ['title', 'text'];

    const _filter = (query, values = {}) => {
        if (values.id) {
            query.andWhere('t.id = :id', { id: values.id });
        }

        if (values.title) {
            query.andWhere('t.title = :title', { title: values.title });
        }

        if (values.text) {
            query.andWhere('t.text = :text', { text: values.text });
        }

        return query;
    };

    return {
        findOne: async (filter) => {
            const query = queryBuilder(selectColumns, 'Post');
            _filter(query, filter);
            return one(query, columns);
        },

        findAll: async (filter, page = 1, count = 10) => {
            const query = queryBuilder(selectColumns, 'Post');
            _filter(query, filter);

            return many(query, columns, page, count);
        },

        findOneRaw: async (filter) => {
            const query = queryBuilder(selectColumns, 'Post');
            _filter(query, filter);
            return oneRaw(query);
        },

        columns,
    };
};
