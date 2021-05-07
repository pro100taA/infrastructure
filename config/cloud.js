({
    'aws': {
        'accessKeyId': '',
        'secretAccessKey': '',
        'bucketName': 'image-picker-demo',
        'region': 'us-east-1'
    },
    'google': {
        'projectId': '',
        'keyFilename': require('./clouds/google/config.json'),
        'bucketName': ''
    },
    'azure': {
        'connString': '',
        'container': ''
    },
    'general': {
        'lifetime': 15,
        'size': 1024 * 1024
    }
});
