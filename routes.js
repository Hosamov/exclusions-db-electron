const passport = require('passport');
const Account = require('./models/account');
const Exclusion = require('./models/exclusion');
const moment = require('moment');

module.exports = function (app) {
  //*********** GET ROUTES ************/
  //* Root(/) GET route
  app.get('/', (req, res, next) => {
    res.render('home');
  });

  //* Home GET route (for logged-in users)
  app.get('/home', (req, res, next) => {
    if (req.isAuthenticated()) {
      Exclusion.find({}, (err, foundExclusion) => {
        if (err) {
          console.log(err);
        } else {
          // console.log(foundExclusion);
          Account.findOne(
            { username: { $eq: req.user.username } },
            (err, foundUser) => {
              if (err) {
                console.log(err);
              } else {
                if (foundUser.active) {
                  res.render('user-home', { exclusions: foundExclusion });
                } else {
                  console.log('inactive');
                  res.render('unauthorized');
                }
              }
            }
          );
        }
      });
    } else {
      res.redirect('/');
    }
  });

  //* Login GET route
  app.get('/login', (req, res, next) => {
    res.render('login');
  });

  //* Retry_login GET route
  app.get('/retry_login', (req, res, next) => {
    res.render('retry_login');
  });

  //* Unauthorized GET route
  app.get('/unauthorized', (req, res, next) => {
    res.render('unauthorized');
  });

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
    res.render('register');
  });

  //* Edit_user GET route
  app.get('/edit_user', (req, res, next) => {
    // Accessible by Admin users only
    // edit user's auth level
    res.send('Edit User page');
  });

  //* Add_new_exclusion GET route
  app.get('/add_new_exclusion', (req, res, next) => {
    if (req.isAuthenticated()) {
      Exclusion.find({}, (err, exclusions) => {
        if (err) {
          console.log(err);
          res.status(500).send('An error occurred', err);
        } else {
          res.render('new-exclusion');
        }
      });
      // Accessible by Admin and supervisors only
      // res.render('new-exclusion');
    }
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
  app.post('/login', (req, res) => {
    // Uses passport.js to authenticate user
    const account = new Account({
      username: req.body.username,
      password: req.body.password,
    });
    req.login(account, (err) => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate('local', { failureRedirect: '/retry_login' })(
          req,
          res,
          () => {
            Account.findOne(
              { username: account.username },
              (err, foundUser) => {
                if (err) {
                  console.log(err);
                } else {
                  if (foundUser.active) {
                    console.log('User is active!');
                    res.redirect('/home');
                  } else {
                    console.log('User is not active!');
                    res.redirect('/unauthorized');
                  }
                }
              }
            );
          }
        );
      }
    });
  });

  //* Register POST route
  app.post('/register', (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    const userKey = req.body.user_key;
    // Uses passport.js to register a new user, set their auth level
    if (req.body.password === req.body.verify_password) {
      Account.register({ username: username }, password, (err, account) => {
        if (err) {
          console.log(err);
          res.redirect('/register');
        } else {
          passport.authenticate('local')(req, res, () => {
            console.log('Registration successful.');
            Account.findOne({ username: username }, (err, foundUser) => {
              if (err) {
                console.log(err);
              } else {
                if (userKey === process.env.USER_KEY) {
                  // Check if (admin) userkey has been inputted, and if it matches
                  console.log('User Key Accepted!');
                  foundUser.role = 'admin';
                  foundUser.active = true;
                } else {
                  console.log('Invalid user key/no key entered.');
                  foundUser.role = null;
                  foundUser.active = false;
                }
                foundUser.save(() => {
                  console.log('New user has been registered...');
                  userKey === process.env.USER_KEY
                    ? res.redirect('/home')
                    : res.redirect('/unauthorized');
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
  app.post('/add_exclusion', async (req, res, next) => {
    // Add new exclusion data from /add_new_exclusion GET route
    let excl = {
      name: req.body.name,
      dob: req.body.dob,
      other_info: req.body.other_info,
      ordinance: req.body.ordinance,
      description: req.body.description,
      date_served: moment(req.body.date_served).format('YYYY-MM-DD'),
      exp_date: req.body.exp_date,
      length: req.body.length,
      other_length: req.body.other_length,
      img_url: req.body.img_url,
    };

    //* Calculations for adding exclusion length to served date:
    let exclusionLength;
    Date.prototype.addDays = function (days) {
      let date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };

    const dateServed = new Date(excl.date_served);

    // Checks for which 'length' form field used:
    if (excl.other_length !== null && excl.other_length !== '') {
      excl.exp_date = dateServed.addDays(parseInt(excl.other_length));
    } else {
      excl.exp_date = dateServed.addDays(parseInt(excl.length));
    }

    console.log(excl);

    //* Insert data into DB:
    await Exclusion.create(
      [
        {
          name: excl.name,
          dob: moment(excl.dob).format('MM/DD/YYYY'),
          other_info: excl.other_info,
          ordinance: excl.ordinance,
          description: excl.description,
          date_served: moment(excl.date_served.toString()).format('MM/DD/YYYY'),
          exp_date: moment(excl.exp_date.toString()).format('MM/DD/YYYY'),
          length: excl.length,
          other_length: excl.other_length,
          img_url: excl.img_url,
        },
      ],
      (err) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect('/home');
        }
      }
    );
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
