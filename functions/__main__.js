const path = require('path');
const {promisify} = require('util');

const renderFile = promisify(require('ejs').renderFile);
const templatePath = path.join(__dirname, '/../public/index.html');

let app;

/**
 * Render the main index of the single-page app.
 * @returns {object.http}
 */
module.exports = async context => {
  let servicePath =
    context.service.environment === 'local'
      ? `/${context.service.identifier}`
          .replace('.', '/')
          .substr(0, context.service.identifier.indexOf('[') + 1)
      : '';

  app = app || (await renderFile(templatePath, {path: servicePath}));

  return {
    headers: {
      'content-type': 'text/html',
    },
    body: app,
    statusCode: 200,
  };
};
