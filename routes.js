const passport = require('passport');
const moment = require('moment');
const reCAPTCHA = require('recaptcha2');
const mongoose = require('mongoose');

const Account = require('./models/account');
const Exclusion = require('./models/exclusion');

const email = require('./emailer');
const emailBodies = require('./includes/email-bodies');

const recaptcha = new reCAPTCHA({
  siteKey: process.env.SITEKEY, // retrieved during setup
  secretKey: process.env.SECRETKEY, // retrieved during setup
});

function submitForm(req, res) {
  console.log(recaptcha);
  recaptcha.validateRequest(req)
    .then(function () {
      res.json({ formSubmit: true });
    })
    .catch(function (errorCodes) {
      res.json({
        formSubmit: false,
        errors: recaptcha.translateErrors(errorCodes),
      });
    });
}

module.exports = function (app) {
  //*********** GET ROUTES ************/

  //* Root(/) GET route
  app.get('/', (req, res, next) => {
    res.render('home');
  });

  //* Login GET route
  app.get('/login', (req, res, next) => {
    res.render('login', {
      recaptcha: recaptcha.formElement('g-recaptcha'),
    });
  });

  //* Retry_login GET route
  app.get('/retry_login', (req, res, next) => {
    res.render('retry-login');
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
    res.render('register');
  });

  app.get('/register_success', (req, res, next) => {
    if (req.isAuthenticated()) {
      res.render('register-success');
    } else {
      res.render('unauthorized');
    }
  });

  ////* BEGIN USERS Routes ////

  //* Users GET route
  app.get('/users', (req, res, next) => {
    // Accessible by Admin users only
    // Displays a list of all users, their roles and active status
    if (req.isAuthenticated()) {
      if (req.user.role === 'admin') {
        Account.find({}, (err, users) => {
          if (err) {
            console.log(err);
          } else {
            res.render('./users/users', { users: users });
          }
        });
      } else {
        res.redirect('/unauthorized');
      }
    } else {
      res.redirect('/');
    }
  });

  //* /user/:users GET route
  app.get('/users/:user', (req, res, next) => {
    const user = req.params.user;
    // Accessible by Admin and all individual users
    // Admin allowances: Edit/set user's auth level, add, delete users
    // User allowance: Reset password
    if (req.isAuthenticated()) {
      const thisUser = {
        loggedInUser: req.user.username,
        loggedInUserRole: req.user.role,
        active: req.user.active,
        role: req.user.role,
      };
      if (req.user.role === 'admin' || req.user.username === user) {
        Account.find({ username: { $eq: user } }, (err, foundUser) => {
          if (err) {
            console.log(err);
          } else {
            res.render('./users/user', {
              user: foundUser,
              currentUser: thisUser,
            });
          }
        });
      } else {
        res.redirect('/unauthorized');
      }
    } else {
      res.redirect('/');
    }
  });

  //* /user/:users/edit_user GET route
  app.get('/users/:user/edit_user', (req, res, next) => {
    const user = req.params.user;
    // Accessible by Admin users only
    // edit user's auth level, add, delete users
    if (req.isAuthenticated()) {
      const thisUser = {
        loggedInUser: req.user.username,
        loggedInUserRole: req.user.role,
        active: req.user.active,
        role: req.user.role,
      };
      if (
        thisUser.loggedInUserRole === 'admin' ||
        thisUser.loggedInUser === user
      ) {
        Account.find({ username: { $eq: user } }, (err, foundUser) => {
          if (err) {
            console.log(err);
          } else {
            console.log(foundUser);
            res.render(`./users/edit-user`, {
              user: foundUser,
              currentUser: thisUser,
            });
          }
        });
      } else {
        res.redirect('/unauthorized');
      }
    } else {
      res.redirect('/');
    }
  });

  //* /user/:users/DELETE_user GET route
  app.get('/users/:user/delete_user', async (req, res, next) => {
    // Accessible by Admin users only
    // edit user's auth level, add, delete users
    if (req.isAuthenticated()) {
      const user = req.params.user;

      if (req.user.role === 'admin') {
        await Account.deleteOne({ username: user })
          .then(() => {
            res.redirect('/users');
            console.log(`Account for ${user} successfully deleted.`);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      res.redirect('/unauthorized');
    }
  });

  //* /user/:users/confirm_delete GET route
  app.get('/users/:user/confirm_delete', (req, res, next) => {
    // Renders delete-confirm template, presents confirmation page prior to
    // deletion of user
    if (req.isAuthenticated()) {
      const user = req.params.user;
      if (req.user.role === 'admin') {
        res.render('./users/delete-confirm', { user: user });
      }
    } else {
      res.redirect('/unauthorized');
    }
  });

  ////* END USER Routes ////

  ////* BEGIN EXCLUSIONS Routes ////

  //* Home GET route (for logged-in users) - Displays list of all active exclusions
  app.get('/home', (req, res, next) => {
    if (req.isAuthenticated()) {
      const thisUser = {
        loggedInUser: req.user.username,
        loggedInUserRole: req.user.role,
        active: req.user.active,
        role: req.user.role,
      };
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
                  res.render('user-home', {
                    exclusions: foundExclusion,
                    user: thisUser,
                  });
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

  //* Add_new_exclusion GET route
  app.get('/add_new_exclusion', (req, res, next) => {
    // Accessible by Admin and supervisors only
    if (req.isAuthenticated()) {
      if (
        req.user.role === 'admin' ||
        (req.user.role === 'supervisor' && req.user.active === true)
      ) {
        Exclusion.find({}, (err, exclusions) => {
          if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
          } else {
            res.render('./exclusions/new-exclusion', { currentUser: req.user });
          }
        });
      } else {
        res.redirect('/unauthorized');
      }
    } else {
      res.redirect('/');
    }
  });

  //* Single exclusion GET route - display only one (selected) exclusion order
  app.get('/home/:exclusion_id', (req, res, next) => {
    const exclusionId = req.params.exclusion_id; // Find user based on ID
    if (req.isAuthenticated()) {
      Exclusion.findOne({ _id: { $eq: exclusionId } }, (err, exclusion) => {
        if (err) {
          console.log(err);
          res.redirect('/error'); // Render /error route
        } else {
          res.render('./exclusions/exclusion', { exclusion: exclusion });
        }
      });
    } else {
      res.redirect('/unauthorized');
    }
  });

  //* Edit exclusion GET route
  app.get('home/:exclusion/edit', (req, res, next) => {
    // Accessible by Admin and supervisors only
    res.send('Edit Exclusion Page');
  });

  //* Delete exclusion GET route
  app.get('/home/:exclusion/delete', (req, res, next) => {
    // Viewable by all users
    res.send('Delete exclusion confirmation page.');
  });

  //* Archive exclusion GET route
  app.get('home/:exclusion/archive', (req, res, next) => {
    //FIXME: Is this a necessary route?
    // Accessible by Admin and supervisors only
    res.send('Archive Exclusion Page');
  });

  //* Archive GET route
  app.get('/home/archive', (req, res, next) => {
    res.send('Archived/Past Exclusion Orders Page');
  });

  ////* END EXCLUSIONS Routes ////

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
        submitForm(req, res);
        // passport.authenticate('local', { failureRedirect: '/retry_login' })(
        //   req,
        //   res,
        //   () => {
        //     Account.findOne(
        //       { username: account.username },
        //       (err, foundUser) => {
        //         if (err) {
        //           console.log(err);
        //         } else {
        //           if (foundUser.active) {
        //             console.log('User is active!');
        //             res.redirect('/home');
        //           } else {
        //             console.log('User is not active!');
        //             res.redirect('/unauthorized');
        //           }
        //         }
        //       }
        //     );
        //   }
        // );
      }
    });
  });

  //* Register POST route
  app.post('/register', (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    const userKey = req.body.user_key;
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    // Uses passport.js to register a new user, set their auth level
    if (req.body.password === req.body.verify_password) {
      Account.register({ username: username }, password, (err, account) => {
        if (err) {
          console.log(err);
          res.redirect('/register');
        } else {
          passport.authenticate('local')(req, res, () => {
            console.log('Registration successful.');
            // Send email to newly registered user:
            email(
              'Successful Registration - Exclusion DB',
              `<p>Congrats, ${firstName}!</p> ${emailBodies.register_body}`,
              username
            ).catch(console.error);

            Account.findOne({ username: username }, (err, foundUser) => {
              if (err) {
                console.log(err);
              } else {
                foundUser.first_name = firstName;
                foundUser.last_name = lastName;
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
                  res.redirect('/register_success');
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
    let userInfo = {
      username: req.body.email,
      currentPassword: req.body.current_password,
      newPassword: req.body.new_password,
      confirmedPassword: req.body.confirm_password,
      active: req.body.is_active,
      userRole: req.body.user_role,
      firstName: req.body.first_name,
      lastName: req.body.last_name,
    };

    console.log(userInfo);
    // First, check if the user has updated their password:

    Account.findOne({ username: userInfo.username }, async (err, foundUser) => {
      if (err) {
        console.log(err);
      } else {
        // console.log(foundUser);
        if (
          foundUser.newPassword === foundUser.confirmedPassword &&
          foundUser.newPassword !== ''
        ) {
          // https://alto-palo.com/blogs/nodejs-authentication-with-passportjs-passport-local-mongoose/
          foundUser.changePassword(
            userInfo.currentPassword,
            userInfo.newPassword,
            (err, user) => {
              if (err) {
                console.log(err);
              } else {
                res.render('./users/account-success');
              }
            }
          );
        }
        // Post data to user account:
        foundUser.username = userInfo.username;
        foundUser.active =
          userInfo.active === 'on' || userInfo.active === 'true' ? true : false;
        foundUser.role = userInfo.userRole;
        foundUser.first_name = userInfo.firstName;
        foundUser.last_name = userInfo.lastName;
        await foundUser.save((err) => {
          if (err) {
            console.log(err);
          } else {
            console.log(foundUser.username + ' has been successfully updated.');
            res.render('./users/account-success', { user: userInfo });
          }
        });
      }
    });
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
      signature: req.body.signature,
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
          signature: excl.signature,
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
