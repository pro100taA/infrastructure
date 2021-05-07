const Queue = require('./queue');
const EventEmitter = require('events');
const fetch = require('node-fetch');

const upload = (encrypted, url) => {
    const file = JSON.stringify(encrypted, null, 2);

    const headers = {
        'Content-Type': 'application/octet-stream',
    };

    if (url.includes('blob.core.windows.net')) {
        headers['x-ms-blob-type'] = 'BlockBlob';
    }

    return fetch(url, {
        method: 'PUT',
        headers,
        body: file,
    });
};

const getQueue = (progress, resolve) =>
    Queue.channels(10)
        .process(async (task, next) => {
            try {
                await task();
            } catch (e) {
                console.error(e);
            }
            next();
        })
        .drain(() => {
            progress.emit('finish');
            resolve(true);
        });

const uploadUrls = (file, groups) => {
    const progress = new EventEmitter();
    const promise = new Promise((resolve) => {
        const queue = getQueue(progress, resolve);
        const maxChunk = groups.length;

        groups.forEach(async (urls, index) => {
            const chunk = file;
            urls.forEach(({ url }, indexUrl) => {
                queue.add(async () => {
                    await upload(chunk, url);
                    progress.emit('uploadChunk', indexUrl + 1, urls.length);
                });
            });

            queue.add(async () => {
                progress.emit('nextChunk', index + 1, maxChunk);
            });
        });

        progress.on('break', () => {
            queue.break();
            resolve(false);
        });
    });

    return [promise, progress];
};

module.exports = uploadUrls;
