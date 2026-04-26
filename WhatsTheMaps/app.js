/** Configures Express app, shared middleware, top-level routes */
const { createApp } = require('./createApp');
const port = process.env.PORT || 3000;
const app = createApp();

// `npm start` boots through `bin/www`, but keeps `node app.js` working
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
