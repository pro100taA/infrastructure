({
    senderEmail: '',
    service: '',
    config: {
        auth: {
            api_key: '',
            domain: ''
        }
    },
    templates: 'templates/mail',
    default: {
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail',
    }
});
