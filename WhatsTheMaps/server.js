const express = require("express");
const app = express();
const port = 3000;
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


app.get("/", function (req, res) {
  res.render("home");
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});
