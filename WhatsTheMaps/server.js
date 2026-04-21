/** Legacy lightweight server entry for basic local rendering experiments */
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

// File serves simple static page renders without full app routing stack
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/cities', function (req, res) {
  res.render('cities');
});

app.get('/dashboard', function (req, res) {
  res.render('dashboard');
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});
