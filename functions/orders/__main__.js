const {orders} = require('../../stripe/inventory');

/**
 * Create an order.
 * @param {string} currency
 * @param {array} items
 * @param {string} email
 * @param {object} shipping
 * @returns {object}
 */
module.exports = async (currency, items, email, shipping, context) => {
  let order;

  try {
    order = await orders.create(currency, items, email, shipping);
  } catch (err) {
    return {error: err.message};
  }

  return {order};
};
