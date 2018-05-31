const config = require('../config');
const {orders} = require('../stripe/inventory');
const stripe = require('stripe')(config.stripe.secretKey);
stripe.setApiVersion(config.stripe.apiVersion);

/**
 * Webhook handler to process payments for sources asynchronously.
 * @returns {any}
 */
module.exports = async context => {
  let data = context.params.data;

  if (config.stripe.webhookSecret) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = context.http.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        context.http.body,
        signature,
        config.stripe.webhookSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return {
        body: 'Bad request',
        statusCode: 400,
      };
    }
    // Extract the object from the event.
    data = event.data;
  }

  const object = data.object;

  // Monitor `source.chargeable` events.
  if (
    object.object === 'source' &&
    object.status === 'chargeable' &&
    object.metadata.order
  ) {
    const source = object;
    console.log(`🔔  Webhook received! The source ${source.id} is chargeable.`);
    // Find the corresponding order this source is for by looking in its metadata.
    const order = await orders.retrieve(source.metadata.order);
    // Verify that this order actually needs to be paid.
    if (
      order.metadata.status === 'pending' ||
      order.metadata.status === 'paid' ||
      order.metadata.status === 'failed'
    ) {
      return {
        body: 'Bad request',
        statusCode: 400,
      };
    }

    // Note: We're setting an idempotency key below on the charge creation to
    // prevent any race conditions. It's set to the order ID, which protects us from
    // 2 different sources becoming `chargeable` simultaneously for the same order ID.
    // Depending on your use cases and your idempotency keys, you might need an extra
    // lock surrounding your webhook code to prevent other race conditions.
    // Read more on Stripe's best practices here for asynchronous charge creation:
    // https://stripe.com/docs/sources/best-practices#charge-creation

    // Pay the order using the source we just received.
    let charge, status;
    try {
      charge = await stripe.charges.create(
        {
          source: source.id,
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
      // For the demo, we simply set the status to mark the order as failed.
      status = 'failed';
    }
    if (charge && charge.status === 'succeeded') {
      status = 'paid';
    } else if (charge) {
      status = charge.status;
    } else {
      status = 'failed';
    }
    // Update the order status based on the charge status.
    await orders.update(order.id, {metadata: {status}});
  }

  if (
    object.object === 'charge' &&
    object.status === 'succeeded' &&
    object.source.metadata.order
  ) {
    const charge = object;
    console.log(`🔔  Webhook received! The charge ${charge.id} succeeded.`);
    // Find the corresponding order this source is for by looking in its metadata.
    const order = await orders.retrieve(charge.source.metadata.order);
    // Update the order status to mark it as paid.
    await orders.update(order.id, {metadata: {status: 'paid'}});
  }

  // Monitor `source.failed`, `source.canceled`, and `charge.failed` events.
  if (
    (object.object === 'source' || object.object === 'charge') &&
    (object.status === 'failed' || object.status === 'canceled')
  ) {
    const source = object.source ? object.source : object;
    console.log(`🔔  Webhook received! Failure for ${object.id}.`);
    if (source.metadata.order) {
      // Find the corresponding order this source is for by looking in its metadata.
      const order = await orders.retrieve(source.metadata.order);
      // Update the order status to mark it as failed.
      await orders.update(order.id, {metadata: {status: 'failed'}});
    }
  }

  return {
    body: '',
    statusCode: 200,
  };
};
