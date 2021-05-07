class DomainError extends Error {
    constructor(message) {
        super(message);
        this.code = 5000;
    }
}

module.exports = {
    DomainError
};
