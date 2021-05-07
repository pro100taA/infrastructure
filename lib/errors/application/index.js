class ApplicationError extends Error {
    constructor(message) {
        super(message);
        this.code = 1000;
    }
}

module.exports = {
    ApplicationError
};
