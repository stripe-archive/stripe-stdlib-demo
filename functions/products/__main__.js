const {products} = require('../../stripe/inventory');
const setup = require('../../stripe/setup');

/**
 * Retrieve all products.
 * @returns {object}
 */
module.exports = async () => {
  const productList = await products.list();

  // Check if products exist on Stripe Account.
  if (products.exist(productList)) {
    return productList;
  }

  // We need to set up the products.
  await setup.run();
  return products.list();
};
