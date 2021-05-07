module.exports = (stripe) => {
    const create = async (email) => stripe.customers.create({
        email
    });

    const updateCustomerDefaultPaymentMethod = async (customerId, paymentMethodId) => stripe.customers.update(
        customerId,
        {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        }
    );

    const retrieveInformation = async (customerId) => stripe.customers.retrieve(customerId);

    return {
        create,
        updateCustomerDefaultPaymentMethod,
        retrieveInformation,
    };
};
