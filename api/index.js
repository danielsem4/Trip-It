// Vercel Function entry: the whole Express app, reached through the /api rewrite in vercel.json.
// Compiled by the build command (server `npm run build`) so it uses the server's own TypeScript setup.
module.exports = require('../server/dist/app').default;
