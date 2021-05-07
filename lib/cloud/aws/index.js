const AWS = require('aws-sdk');

const getOptions = (Bucket) => (Key, options = {}) => ({
    Bucket,
    Key,
    ...options,
});

module.exports = (config) => {
    const { region, accessKeyId, secretAccessKey, bucketName: Bucket, lifetime } = config;

    AWS.config.update({ region });

    const s3 = new AWS.S3({
        accessKeyId,
        secretAccessKey,
        region,
        signatureVersion: 'v4',
        //   useAccelerateEndpoint: true
    });

    const _getOptions = getOptions(Bucket);

    const getUploadURL = async (
        name,
        options = { ACL: 'private', Expires: lifetime * 60, ContentType: 'application/octet-stream' },
    ) => {
        const s3Params = _getOptions(name, options);

        return {
            url: s3.getSignedUrl('putObject', s3Params),
            name,
        };
    };

    const getDownloadUrl = async (name, options = { Expires: lifetime * 60 }) => {
        const s3Params = _getOptions(name, options);

        console.log(s3Params);
        return {
            url: s3.getSignedUrl('getObject', s3Params),
        };
    };

    return {
        getUploadURL,
        getDownloadUrl,
    };
};
