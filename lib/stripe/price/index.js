module.exports = (stripe, product) => {
    const retrieveInformation = async (priceId) => stripe.prices.retrieve(priceId);

    const productPrices = async () => stripe.prices.list({
        product,
        active: true
    });

    return {
        retrieveInformation,
        productPrices,
    };
};
