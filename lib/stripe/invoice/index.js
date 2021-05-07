module.exports = (stripe) => {
    const create = async (customerId, subscriptionId, description = '') => stripe.invoices.create({
        customer: customerId,
        subscription: subscriptionId,
        description
    });

    const pay = async (invoiceId) => stripe.invoices.pay(invoiceId);

    const retrieveCustomerInvoices = async (customerId, subscriptionId, startingAfter = undefined, limit = 10) => stripe.invoices.list({
        customer: customerId,
        subscription: subscriptionId,
        starting_after: startingAfter,
        limit,
    });

    return {
        create,
        pay,
        retrieveCustomerInvoices,
    };
};
