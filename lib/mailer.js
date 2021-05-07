const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const Twig = require('twig');

const application = require('./application.js');
const { node } = require('./dependencies.js');
const { path } = node;

const getTransport = (config) => {
    switch (config.service) {
        case 'mailGun':
            return mg(config.config);
    }

    return config.default;
};

const renderFile = (template, options) =>
    new Promise((resolve, reject) => {
        Twig.renderFile(template, options, (err, html) => (err ? reject(err) : resolve(html)));
    });

class Mailer {
    constructor(config, domain) {
        this.init(config, domain);
    }

    init(config, domain) {
        const _config = getTransport(config);

        this.domain = domain;
        this.templates = path.join(application.pathRoot, config.templates);
        this.senderEmail = config.senderEmail;
        this.transporter = nodemailer.createTransport(_config);
    }

    async send(template, metadata, options, subject = 'Sanctuary invitation') {
        const html = await renderFile(`${this.templates}/${template}.twig`, {
            ...options,
            auth: application.auth,
            domain: this.domain,
        });

        if (html) {
            const options = {
                from: this.senderEmail,
                subject,
                ...metadata,
                html,
            };

            const mail = await this.transporter.sendMail(options);
            return mail;
        }
    }

    close() {
        this.transporter = null;
    }
}

module.exports = Mailer;
