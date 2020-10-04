'use strict';

const { EntitySchema } = require('typeorm');
const Post = require('../src/domain/post/entity/Post');

module.exports = new EntitySchema({
    name: 'Post',
    target: Post,
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true
        },
        title: {
            type: 'varchar'
        },
        text: {
            type: 'text'
        }
    }
});
