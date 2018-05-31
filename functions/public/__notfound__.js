const path = require('path');
const mime = require('mime');

const fileio = require('../../helpers/fileio');

let filepath = './public';
let staticFiles = fileio.readFiles(filepath);

/**
 * This endpoint handles all routes to `/public` over HTTP,
 * and maps them to the `./public` service folder.
 * @returns {object.http}
 */
module.exports = async context => {
  // Hot reload for local development.
  if (context.service && context.service.environment === 'local') {
    staticFiles = fileio.readFiles(filepath);
  }

  let staticFilepath = path.join(...context.path.slice(1));
  if (!staticFiles[staticFilepath]) {
    return {
      headers: {
        'Content-Type': 'text/plain',
      },
      body: Buffer.from('404 - Not Found'),
      statusCode: 404,
    };
  }

  let cacheControl =
    context.service.environment === 'release'
      ? 'max-age=31536000'
      : 'max-age=0';

  return {
    headers: {
      'content-type': mime.lookup(staticFilepath),
      'Cache-Control': cacheControl,
    },
    body: staticFiles[staticFilepath],
    statusCode: 200,
  };
};
