const domain = require('./domain');
const application = require('./application');

module.exports = {
    DomainError: domain.DomainError,
    ApplicationError: application.ApplicationError,
    domain,
    application
};
