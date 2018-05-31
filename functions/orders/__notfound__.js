const config = require('../../config');
const {orders} = require('../../stripe/inventory');
const stripe = require('stripe')(config.stripe.secretKey);
stripe.setApiVersion(config.stripe.apiVersion);

/**
 * Handler for the routes /orders/{id}/ and orders/{id}/pay/.
 * @param {string} type
 * @param {boolean} livemode
 * @param {string} status
 * @param {string} id
 * @returns {object}
 */
module.exports = async (
  type = null,
  livemode = null,
  status = null,
  id = null,
  context
) => {
  let orderId = context.path[1];
  let order = await orders.retrieve(orderId);

  let pay = context.path[2];
  if (!pay) {
    return order;
  }

  let source = JSON.parse(context.http.body);

  if (order.metadata.status === 'pending' || order.metadata.status === 'paid') {
    return {order, source};
  }

  // Dynamically evaluate if 3D Secure should be used.
  if (source && type === 'card') {
    // A 3D Secure source may be created referencing the card source.
    source = await dynamic3DS(source, order, context.http.headers);
  }

  // Demo: In test mode, replace the source with a test token so charges can work.
  if (type === 'card' && !livemode) {
    source.id = 'tok_visa';
  }

  // Pay the order using the Stripe source.
  if (source && status === 'chargeable') {
    let charge, status;
    try {
      charge = await stripe.charges.create(
        {
          source: id,
          amount: order.amount,
          currency: order.currency,
          receipt_email: order.email,
        },
        {
          // Set a unique idempotency key based on the order ID.
          // This is to avoid any race conditions with your webhook handler.
          idempotency_key: order.id,
        }
      );
    } catch (err) {
      // This is where you handle declines and errors.
      // For the demo we simply set to failed.
      status = 'failed';
    }
    if (charge && charge.status === 'succeeded') {
      status = 'paid';
    } else if (charge) {
      status = charge.status;
    } else {
      status = 'failed';
    }
    // Update the order with the charge status.
    order = await orders.update(order.id, {metadata: {status}});
  }

  return {order, source};
};

// Dynamically create a 3D Secure source.
const dynamic3DS = async (source, order, headers) => {
  // Check if 3D Secure is required, or trigger it based on a custom rule (in this case, if the amount is above a threshold).
  if (source.card.three_d_secure === 'required' || order.amount > 5000) {
    source = await stripe.sources.create({
      amount: order.amount,
      currency: order.currency,
      type: 'three_d_secure',
      three_d_secure: {
        card: source.id,
      },
      metadata: {
        order: order.id,
      },
      redirect: {
        return_url: headers.origin,
      },
    });
  }
  return source;
};
