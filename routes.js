const passport = require('passport');
const Account = require('./models/account');

module.exports = function (app) {
  //*********** GET ROUTES ************/
  //* Root(/) GET route
  app.get('/', (req, res, next) => {
    res.render('home');
  });

  //* Home GET route (for logged-in users)
  app.get('/home', (req, res, next) => {
    if (req.isAuthenticated()) {
      Account.findOne({'username': {$eq: req.user.username}}, (err, foundUser) => {
        if(err) {
          console.log(err);
        } else {
          console.log(foundUser);
          if(foundUser.active) {
            res.render('user-home');
          } else {
            console.log('inactive');
            res.render('unauthorized');
          } 
        }
      });
      
    } else {
      res.redirect('/');
    }
  });

  //* Login GET route
  app.get('/login', (req, res, next) => {
    res.render('login', { user: req.user });
  });

  //* Unauthorized GET route
  app.get('/unauthorized', (req, res, next) => {
    res.render('unauthorized');
  })

  //* Logout GET route
  app.get('/logout', (req, res) => {
    //Note: Passport 0.6.0^ requires promise cb for req.logout()
    req.logout((err) => {
      if (err) {
        return next(err);
      } else {
        console.log('successfully logged out.');
      }
    });
    res.redirect('/');
  });

  //* Register GET route
  app.get('/register', (req, res, next) => {
    // Accessible by Admin users only
    // Set new user's auth level
    res.render('register', {});
  });

  //* Edit_user GET route
  app.get('/edit_user', (req, res, next) => {
    // Accessible by Admin users only
    // edit user's auth level
    res.send('Edit User page');
  });

  //* Add_new_exclusion GET route
  app.get('/add_new_exclusion', (req, res, next) => {
    // Accessible by Admin and supervisors only
    res.send('Add New Exclusion Page');
  });

  //* Edit_exclusion GET route
  app.get('/edit_exclusion', (req, res, next) => {
    // Accessible by Admin and supervisors only
    res.send('Edit Exclusion Page');
  });

  //* Archive_exclusion GET route
  app.get('/archive_exclusion', (req, res, next) => {
    // Accessible by Admin and supervisors only
    res.send('Archive Exclusion Page');
  });

  //* Past_order GET route
  app.get('/past_orders', (req, res, next) => {
    res.send('Past Exclusion Orders Page');
  });

  //*********** POST ROUTES ************/
  //* Login POST route
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

  //* Register POST route
  app.post('/register', (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role;
    const active = req.body.active;
    const userKey = req.body.user_key;
    // Uses passport.js to register a new user, set their auth level
    if (req.body.password === req.body.verify_password) {
      Account.register({ username: username }, password, (err, user) => {
        if (err) {
          console.log(err);
          res.redirect('/register');
        } else {
          passport.authenticate('local')(req, res, () => {
            console.log('Registration successful.');
            Account.findOne({ username: username }, (err, foundUser) => {
              if(err) {
                console.log(err);
              } else {
                if(userKey === process.env.USER_KEY) {
                  console.log('User Key Accepted!')
                  foundUser.role = 'admin';
                  foundUser.active = true;
                } else {
                  console.log('Invalid user key or no key entered.');
                  foundUser.role = null;
                  foundUser.active = false;
                } 
                foundUser.save(() => {
                  console.log('New user has been registered...');
                  userKey===process.env.USER_KEY ? res.redirect('/home') : res.redirect('/unauthorized');
                });
              }
            });
          });
        }
      });
    } else {
      console.log('Registration failed!');
      res.redirect('/register');
    }
  });

  //* Edit_user POST route
  app.post('/edit_user', (req, res, next) => {
    // Edit a registered user from /edit_user GET route
  });

  //* Add_exclusion POST route
  app.post('/add_exclusion', (req, res, next) => {
    // Add a new exclusion from /add_new_exclusion GET route
  });

  //* Edit_exclusion POST route
  app.post('/edit_exclusion', (req, res, next) => {
    // Add a new exclusion from /edit_exclusion GET route
  });

  //* Archive_exclusion POST route
  app.post('/archive_exclusion', (req, res, next) => {
    // Archive exclusion, from archive_exclusion GET route
  });
};
