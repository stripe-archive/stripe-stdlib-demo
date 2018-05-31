# Stripe on StdLib Demo

<a href="https://code.xyz/?github=stripe/stripe-stdlib-demo"><img src="https://code.xyz/button/?format=svg" alt="Open in Code.xyz" height="32"></a>

Welcome to the Stripe on StdLib demo! This repository shows how to build frictionless Stripe integrations on top of StdLib’s serverless platform and their browser-based API development environment, [Code.xyz](https://code.xyz).

This project extends our universal [Stripe Payments Demo](https://github.com/stripe/stripe-payments-demo), a sample e-commerce store that uses [Stripe Elements](https://stripe.com/docs/elements) and the [Sources API](https://stripe.com/docs/sources) to accept both card payments and additional payment methods on the web. Please refer to the main project to learn more and find backend code in more languages.

StdLib allows anybody to quickly ship scalable and production-ready APIs. We’ve ported our payments demo from Express to a serverless-based approach on StdLib to serve API endpoints, the Stripe webhook integration, and the single-page app. You can [explore this repository on Code.xyz](https://code.xyz?github=stripe/stripe-stdlib-demo). We hope you enjoy!

## Overview

<img src="public/images/screenshots/demo-chrome.png" alt="Demo on Google Chrome" width="610"><img src="public/images/screenshots/demo-iphone.png" alt="Demo on Safari iPhone X" width="278">

You can read more about the features from this app on the [main payments repository](https://github.com/stripe/stripe-payments-demo#overview).

## Stripe and StdLib Integration

This section gives you some details about how this Stripe and StdLib integration works.

### API Endpoints

The `functions` directory contains the code for all the API endpoints consumed by the single-page demo. [FaaSlang](https://github.com/faaslang/faaslang#what-is-faaslang) defines semantics and rules for the deployment and execution of these serverless functions.

The ability to create orders via a POST request on `/orders` is defined in [`functions/orders/__main__.js`](functions/orders/__main__.js), and the ability to list products via a GET request on `/products` is defined in [`functions/products/__main__.js`](functions/products/__main__.js). These functions rely on the [`stripe/inventory.js`](stripe/inventory.js) library which helps with product and order management on Stripe.

The interesting thing to note is that for API endpoints which contain IDs in their path, such as `POST /orders/{id}/pay` to pay a specific order, the serverless function is defined in [`functions/orders/__notfound__.js`](functions/orders/__notfound__.js), which is called automatically since the endpoint has a variable. The same applies for fetch a specific product.

The Stripe webhook handler is defined in [`functions/webhook.js`](functions/webhook.js).

### Single-Page App and Static Assets

The frontend code for the demo lives in the `public` directory. In particular, [`public/javascripts/payments.js`](public/javascripts/payments.js) creates the payment experience using Stripe Elements, and [`public/javascripts/store.js`](public/javascripts/store.js) handles the inventory and order management on Stripe.

The main app template is served by a function, specifically the main function defined in [`functions/__main__.js`](functions/__main__.js). All the static assets (scripts, stylesheets, and images) are also rendered by a function, specifically via the [`functions/public/__notfound__.js`](functions/public/__notfound__.js) function which relies on the [`fileio.js`](helpers/fileio.js) helper to read and map files from the `public` directory.

## Getting Started

You’ll need the following:

* [Node.js](http://nodejs.org) >= 8.x.
* Modern browser that supports ES6 (Chrome to see the Payment Request, and Safari to see Apple Pay).
* Stripe account to accept payments ([sign up](https://dashboard.stripe.com/register) for free).
* StdLib account to deploy the project ([sign up](https://stdlib.com/) for free).

In your Stripe Dashboard, you can [enable the payment methods](https://dashboard.stripe.com/payments/settings) you’d like to test with one click. Some payment methods require receiving a real-time webhook notification to complete a charge. This StdLib demo exposes an endpoint for webhooks which you can enter in your webhooks settings on Stripe (it should look like `https://<username>.lib.id/<service>@dev/webhook`).

## Deploying to StdLib

The simplest way to test and deploy this project is to use the [Code.xyz](https://code.xyz/?github=stripe/stripe-stdlib-demo) development environment, but you can also clone this repository locally and use the StdLib command line tools.

In both cases, you’ll need to copy the file `env.example.json` to `env.json` and fill in your own [Stripe API keys](https://dashboard.stripe.com/account/apikeys) and any other configuration details.

To install StdLib command line tools, run the following command:

    npm install lib.cli -g

Login or create a StdLib account from the command line:

    lib login

You can now push the code to StdLib:

    lib up dev

This Stripe demo should now be running at `https://<username>.lib.id/<service>@dev/`. You should also see in your Terminal the URL of your webhook endpoint to enter in your Stripe account if you’d like to try non-card payment methods which are asynchronous: `https://<username>.lib.id/<service>@dev/webhook`.

## More about StdLib

If you want to join the StdLib community, you can visit [stdlib.com](https://stdlib.com) or [follow StdLib on Twitter](https://twitter.com/StdLibHQ).
