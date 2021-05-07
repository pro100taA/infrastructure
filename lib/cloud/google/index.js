const { Storage } = require('@google-cloud/storage');

const getUrl = (storage, bucketName) => async (name, options) => {
    const [url] = await storage
        .bucket(bucketName)
        .file(name)
        .getSignedUrl(options);

    return url;
};

const getOptions = lifetime => (action, options = {}) => ({
    version: 'v4',
    expires: Date.now() + lifetime * 60 * 1000,
    action,
    ...options
});

module.exports = config => {
    const {
        projectId,
        keyFilename,
        bucketName,
        lifetime
    } = config;

    const storage = new Storage({
        keyFilename,
        projectId,
    });

    const _getUrl = getUrl(storage, bucketName);
    const _getOptions = getOptions(lifetime);

    const getUploadURL = async (name, contentType = 'application/octet-stream') => {
        const options = _getOptions('write', { contentType });
        const url = await _getUrl(name, options);

        return {
            url,
            name,
        };
    };

    const getDownloadUrl = async (name) => {
        const options = _getOptions('read');
        const url = await _getUrl(name, options);

        return {
            url,
        };
    };

    return {
        getUploadURL,
        getDownloadUrl
    };
};
