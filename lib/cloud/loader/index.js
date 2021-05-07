const _default = require('./ algorithm/default');

module.exports = (aws, google, azure, config) => alg => {
    switch (alg) {
        default:
            return _default(aws, google, azure, config);
    }
};
