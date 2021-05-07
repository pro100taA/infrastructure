module.exports = (stripe) => {
    const create = async (customerId, cardData, billingData = {}, methodType = 'card') => {
        const paymentMethod = await stripe.paymentMethods.create({
            type: methodType,
            card: {
                number: cardData.number,
                exp_month: cardData.month,
                exp_year: cardData.year,
                cvc: cardData.cvc,
            },
            billing_details: {
                name: billingData?.name,
                email: billingData?.email,
                address: {
                    postal_code: billingData?.code
                },
            },
        });

        return stripe.paymentMethods.attach(paymentMethod.id, {
            customer: customerId,
        });
    };

    const remove = async (paymentMethodId) => {
        const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

        return paymentMethod;
    };

    const retrieveInformation = async (paymentMethodId) => stripe.paymentMethods.retrieve(paymentMethodId);

    const customerPaymentMethods = async (customerId, type = 'card') => stripe.paymentMethods.list({
        customer: customerId,
        type,
    });

    return {
        create,
        remove,
        retrieveInformation,
        customerPaymentMethods,
    };
};
