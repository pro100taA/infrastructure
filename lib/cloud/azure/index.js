const azure = require('azure-storage');

const generateSasToken = (connString, container, lifetime) => (blobName, permissions) => {
    const blobService = azure.createBlobService(connString);

    const negativeTime = 5;  // ХЗ зачем, костыль старой версии.

    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - negativeTime);

    const expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + negativeTime + lifetime);

    permissions = permissions || azure.BlobUtilities.SharedAccessPermissions.READ;

    const sharedAccessPolicy = {
        AccessPolicy: {
            Permissions: permissions,
            Start: startDate,
            Expiry: expiryDate,
        },
    };
    const sasToken = blobService.generateSharedAccessSignature(
        container, blobName, sharedAccessPolicy,
    );

    return blobService.getUrl(container, blobName, sasToken, true);
};


module.exports = config => {

    const { connString, container, lifetime } = config;
    const _generateSasToken = generateSasToken(connString, container, lifetime);

    const getUploadURL = async (name) => ({
        url: _generateSasToken(name, 'raw'),
        name,
    });

    const getDownloadUrl = async (name) => ({
        url: _generateSasToken(name, 'r'),
    });

    return {
        getUploadURL,
        getDownloadUrl
    };
};
