const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const Account = require('./models/account');

// Initialize DB:
require('./initDB')();

const app = express();

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('public'));



//*********** GET ROUTES ************/
// Home GET route - redirects to login or homepage depending on authorization
app.get('/', (req, res, next) => {
  res.send('Root page');
});

app.get('/home', (req, res, next) => {
  res.send('Home page');
});

app.get('/login', (req, res, next) => {
  res.render('login', { user: req.user });
});

app.get('/register', (req, res, next) => {
  // Accessible by Admin users only
  // Set new user's auth level
  res.render('register', { });
});

app.get('/edit_user', (req, res, next) => {
  // Accessible by Admin users only
  // edit user's auth level
  res.send('Edit User page');
});

app.get('/add_new_exclusion', (req, res, next) => {
  // Accessible by Admin and supervisors only
  res.send('Add New Exclusion Page');
});

app.get('/edit_exclusion', (req, res, next) => {
  // Accessible by Admin and supervisors only
  res.send('Edit Exclusion Page');
});

app.get('/archive_exclusion', (req, res, next) => {
  // Accessible by Admin and supervisors only
  res.send('Archive Exclusion Page');
});

app.get('/past_orders', (req, res, next) => {
  res.send('Past Exclusion Orders Page');
});

//*********** POST ROUTES ************/
// Login POST route
app.post('/login', passport.authenticate('local'), (req, res, next) => {
  // Uses passport.js to authenticate user
  res.redirect('/');
});

// Register POST route
app.post('/register', (req, res, next) => {
  // Uses passport.js to register a new user, set their auth level
  Account.register(
    new Account({ username: req.body.username }),
    req.body.password,
    (err,
    (account) => {
      if (err) {
        return res.render('register', { account: account });
      }
      passport.authenticate('local')(req, res, () => {
        res.redirect('/');
      });
    })
  );
});

app.post('/edit_user', (req, res) => {
  // Edit a registered user from /edit_user GET route
});

// add_exclusion POST route
app.post('/add_exclusion', (req, res, next) => {
  // Add a new exclusion from /add_new_exclusion GET route
});

// edit_exclusion POST route
app.post('/edit_exclusion', (req, res, next) => {
  // Add a new exclusion from /edit_exclusion GET route
});

// archive_exclusion POST route
app.post('/archive_exclusion', (req, res, next) => {
  // Archive exclusion, from archive_exclusion GET route
});

app.listen(3000, () => {
  console.log('Listening on port 3000...');
});
