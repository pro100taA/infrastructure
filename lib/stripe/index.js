const _stripeLib = require('stripe');
const _invoice = require('./invoice');
const _subscription = require('./subscription');
const _customer = require('./customer');
const _paymentMethod = require('./paymentMethod');
const _price = require('./price');

module.exports = (config) => {
    const { sk, product, prices } = config;
    const stripe = _stripeLib(sk);

    const customer = _customer(stripe);
    const invoice = _invoice(stripe);
    const paymentMethod = _paymentMethod(stripe);
    const price = _price(stripe, product);
    const subscription = _subscription(stripe, invoice);

    return {
        customerCreate: customer.create,
        customerUpdateDefaultPaymentMethod: customer.updateCustomerDefaultPaymentMethod,
        customerRetrieveInformation: customer.retrieveInformation,
        invoiceCreate: invoice.create,
        invoicePay: invoice.pay,
        invoiceRetrieveCustomer: invoice.retrieveCustomerInvoices,
        paymentMethodCreate: paymentMethod.create,
        paymentMethodRemove: paymentMethod.remove,
        paymentMethodRetrieveInformation: paymentMethod.retrieveInformation,
        customerPaymentMethods: paymentMethod.customerPaymentMethods,
        priceRetrieveInformation: price.retrieveInformation,
        productPrices: price.productPrices,
        subscriptionCreate: subscription.create,
        subscriptionUpdate: subscription.update,
        subscriptionCancel: subscription.cancel,
        subscriptionRetrieveInformation: subscription.retrieveInformation,
        configPrices: prices
    };

    // more info https://stripe.com/docs/api
};
