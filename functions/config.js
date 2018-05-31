const config = require('../config');

/**
 * Expose the Stripe publishable key and other pieces of config via an endpoint.
 * @returns {object}
 */
module.exports = async () => {
  return {
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    stripeCountry: config.stripe.country,
    country: config.country,
    currency: config.currency,
  };
};
