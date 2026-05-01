const { createApp } = require('./createApp');

const app = createApp();

const port = process.env.PORT || 3000;

// `npm start` boots through `bin/www`, keeps `node app.js` working
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;