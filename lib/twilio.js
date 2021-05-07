const twilio = require('twilio');

class Twilio {
    constructor(config) {
        this.init(config);
    }

    init(config) {
        this.accountSid = config.accountSid;
        this.authToken = config.token;
        this.phoneNumber = config.phoneNumber;
        this.apiKey = config.apiKey;
        this.apiSecret = config.apiSecret;
    }

    async send(to, msg) {
        const client = twilio(this.accountSid, this.authToken);
        to = this.addCode(to);

        try {
            await client.messages.create({ from: this.phoneNumber, to, body: msg });
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    addCode(phoneNumber) {
        return phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
    }
}

module.exports = Twilio;
