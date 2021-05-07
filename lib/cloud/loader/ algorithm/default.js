const getURLs = (clouds, defaultStep) => type => async (name, size, options = {}) => {
    const chunkedUrls = [];
    const { step = defaultStep } = options;

    const chunks = Math.ceil(size / step);

    for (let i = 1; i <= chunks; i++) {
        const fullName = name + '-' + `${i}`.padStart(5, '0');
        const currentClouds = clouds[i % 3];

        const urls = await Promise.all(
            currentClouds.map(
                cloud => cloud[type](fullName)
            )
        );
        chunkedUrls.push(urls);
    }

    return [
        chunkedUrls,
        step
    ];
};

module.exports = (aws, google, azure, config) => {
    const clouds = [[aws, azure], [azure, google], [google, aws]];

    const { size } = config;

    return getURLs(clouds, size);
};
