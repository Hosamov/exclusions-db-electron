const passport = require('passport');
const Account = require('./models/account');

module.exports = function (app) {
  //*********** GET ROUTES ************/
  // Home GET route - redirects to login or homepage depending on authorization
  app.get('/', (req, res, next) => {
    res.render('home');
  });

  app.get('/home', (req, res, next) => {
    res.render('user-home');
  });

  app.get('/login', (req, res, next) => {
    res.render('login', { user: req.user });
  });

  app.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      } else {
        console.log('successfully logged out.');
      }
    });
    res.redirect('/');
  });

  app.get('/register', (req, res, next) => {
    // Accessible by Admin users only
    // Set new user's auth level
    res.render('register', {});
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
  app.post(
    '/login',
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureMessage: true,
    }),
    (req, res) => {
      // Uses passport.js to authenticate user
      res.redirect('/home');
    }
  );

  // Register POST route
  app.post('/register', (req, res, next) => {
    // Uses passport.js to register a new user, set their auth level
    if (req.body.password === req.body.verify_password) {
      Account.register(
        new Account({ username: req.body.username }),
        req.body.password,
        (err, account) => {
          if (err) {
            console.log(err);
            res.redirect('/register');
          }
          passport.authenticate('local')(req, res, () => {
            console.log('Registration successful.');
            res.redirect('/home');
          });
        }
      );
    }
  });

  app.post('/edit_user', (req, res, next) => {
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
};
