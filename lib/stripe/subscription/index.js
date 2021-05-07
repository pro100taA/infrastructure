module.exports = (stripe, invoice) => {
    const create = async (customerId, items) =>
        stripe.subscriptions.create({
            customer: customerId,
            items,
            expand: ['latest_invoice.payment_intent'],
        });

    const update = async (customerId, subscriptionId, items) => {
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            items,
        });

        const newInvoice = await invoice.create(customerId, subscriptionId);
        await invoice.pay(newInvoice.id);

        return updatedSubscription;
    };

    const cancel = async (subscriptionId) => stripe.subscriptions.del(subscriptionId);

    const retrieveInformation = async (subscriptionId) => {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        return {
            items: subscription.items,
        };
    };

    return {
        create,
        update,
        cancel,
        retrieveInformation,
    };
};
