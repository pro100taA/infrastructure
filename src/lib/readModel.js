() => {
    const { pool } = application.db;

    const formatItems = (items, columns, page = 1, pages = 1, count = 1, total = 1, per_page = 1) => ({
        pages: {
            page,
            pages,
            count,
            total,
            per_page,
        },
        items,
        columns,
    });

    const pagination = (query, page, count) => query.offset(Math.max(count * (page - 1), 0)).limit(count);

    return {
        oneRaw: async (query) => query.getRawOne(),

        one: async (query, columns) => {
            const item = await query.getRawOne();
            return formatItems(item, columns);
        },

        many: async (query, columns, page, perPage) => {
            const total = await query.getCount();
            const pages = Math.ceil(total / perPage);

            pagination(query, page, perPage);

            const items = await query.getRawMany();
            return formatItems(items, columns, page, pages, items.length, total, perPage);
        },
        formatItems,
        queryBuilder: (columns, table, alias = 't') => pool.createQueryBuilder().select(columns).from(table, alias),

        pagination,
    };
};
