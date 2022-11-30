const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

// Initialize DB:
require('./initDB')();

const app = express();

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('public'));

// Home GET route - redirects to login or homepage depending on authorization
app.get('/', (req, res, next) => {
  res.send('Root page');
});

app.get('/home', (req, res, next) => {
  res.send('Home page');
});

app.get('/login', (req, res, next) => {
  res.send('Login page');
});

// Login POST route
app.post('/login', (req, res, next) => {
  // Uses passport.js to authenticate user
});

app.listen(3000, () => {
  console.log('Listening on port 3000...');
});
