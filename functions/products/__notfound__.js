const {products} = require('../../stripe/inventory');

/**
 * Retrieve a product by ID.
 * @returns {any}
 */
module.exports = async context => {
  if (context.path.length > 2) {
    return {
      headers: {
        'content-type': 'text/plain',
      },
      body: Buffer.from('Not found'),
      statusCode: 404,
    };
  }

  let id = context.path[context.path.length - 1];
  return products.retrieve(id);
};
