const aws = require('./aws');
const azure = require('./azure');
const google = require('./google');
const uploader = require('./uploader');
const loader = require('./loader');

module.exports = (config) => {
    const _aws = aws({
        ...config.aws,
        ...config.general,
    });
    const _azure = azure({
        ...config.azure,
        ...config.general,
    });
    const _google = google({
        ...config.google,
        ...config.general,
    });

    const _loader = loader(_aws, _google, _azure, config.general);

    return {
        getUploadUrls: (alg) => _loader(alg)('getUploadURL'),
        getDownloadUrls: (alg) => _loader(alg)('getDownloadUrl'),
        freeUploadUrl: _aws.getUploadURL,
        uploader,
    };
};
