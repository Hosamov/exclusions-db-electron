const passport = require('passport');
const moment = require('moment');
const reCAPTCHA = require('recaptcha2');
const mongoose = require('mongoose');

const Account = require('./models/account');
const Exclusion = require('./models/exclusion');

const email = require('./emailer');
const emailBodies = require('./includes/email-bodies');
const archiveHelper = require('./includes/archive-helper');
const exclusion = require('./models/exclusion');
const e = require('express');

const recaptcha = new reCAPTCHA({
  siteKey: process.env.SITEKEY, // retrieved during setup
  secretKey: process.env.SECRETKEY, // retrieved during setup
});

module.exports = function (app) {
  //*********** GET ROUTES ************/

  //* Root(/) GET route
  app.get('/', (req, res, next) => {
    res.render('home');
  });

  //* Login GET route
  app.get('/login', (req, res, next) => {
    res.render('login', {
      recaptcha: recaptcha.formElement(),
    });
  });

  //* Retry_login GET route
  app.get('/retry_login', (req, res, next) => {
    res.render('retry-login', {
      recaptcha: recaptcha.formElement(),
    });
  });

  //* Unauthorized GET route
  app.get('/unauthorized', (req, res, next) => {
    // Most popular GET route XD
    res.render('unauthorized');
  });

  //* Logout GET route
  app.get('/logout', (req, res, next) => {
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
    res.render('register', {
      recaptcha: recaptcha.formElement('g-recaptcha'),
    });
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
      if (req.user.role === 'admin') { // Authorized user: Admin
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
    // Full control accessible by Admin only:
    // edit user's auth level, add, delete users
    // Individuals users may edit their own passwords
    if (req.isAuthenticated()) {
      const thisUser = {
        loggedInUser: req.user.username,
        loggedInUserRole: req.user.role,
        active: req.user.active,
        role: req.user.role,
      };
      // Make accessible to admin or current user only
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
    // Edit user's auth level, add, delete users
    if (req.isAuthenticated()) {
      const user = req.params.user;
      if (req.user.role === 'admin') { // Make accessible to admin user only
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
      if (req.user.role === 'admin') { // Make accessible to admin user only
        res.render('./users/delete-confirm', { user: user });
      }
    } else {
      res.redirect('/unauthorized');
    }
  });

  ////* END USER Routes ////

  ////* BEGIN EXCLUSIONS Routes ////

  //* Home GET route (for logged-in users) - Displays list of all active exclusions
  app.get('/home', async (req, res, next) => {
    if (req.isAuthenticated()) {
      const thisUser = {
        loggedInUser: req.user.username,
        loggedInUserRole: req.user.role,
        active: req.user.active,
        role: req.user.role,
      };
      if (req.user.active) { // First, ensure current user is active
        Exclusion.find({}, async (err, foundExclusion) => {
          if (err) {
            console.log(err);
          } else {
            const currentExclusionsArr = []; // Holds unarchived exclusions
            await foundExclusion.forEach((item) => {
              // Check all unarchived exclusions
              if (!item.archived) {
                item.archived = archiveHelper(item.exp_date); // Returns Boolean
                currentExclusionsArr.push(item);
                if (item.archived) {
                  // Archive all exclusions due/past due for archive
                  item.save((err) => {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log(item._id + ' has been archived.');
                    }
                  });
                }
              }
            });
            // Find the current user, check if user's account is activated:
            Account.findOne(
              { username: { $eq: req.user.username } },
              (err, foundUser) => {
                if (err) {
                  console.log(err);
                } else {
                  if (foundUser.active) {
                    res.render('./users/user-home', {
                      exclusions: currentExclusionsArr, // Display current exclusions only
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
        }).sort({last_name: 1}); // Sort list in ascending order
      } else {
        res.redirect('/unauthorized');
      }
    } else {
      res.redirect('/unauthorized');
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
    const thisUser = {
      user: req.user.username,
      role: req.user.role,
    };
    if (req.isAuthenticated()) {
      if (req.user.active === true) {
        Exclusion.findOne({ _id: { $eq: exclusionId } }, (err, exclusion) => {
          if (err) {
            console.log(err);
            res.redirect('/error'); // Render /error route
          } else {
            res.render('./exclusions/exclusion', {
              exclusion: exclusion,
              id: exclusionId,
              user: thisUser,
            });
          }
        });
      } else {
        res.redirect('/unauthorized');
      }
    } else {
      res.redirect('/unauthorized');
    }
  });

  //* Edit exclusion GET route
  app.get('/home/:exclusion/edit', (req, res, next) => {
    // Accessible by Admin and supervisors only
    const exclusion_id = req.params.exclusion;
    console.log(exclusion_id);
    if (req.isAuthenticated()) {
      if (
        req.user.role === 'admin' ||
        (req.user.role === 'supervisor' && req.user.active === true)
      ) {
        Exclusion.findOne(
          { _id: { $eq: exclusion_id } },
          (err, foundExclusion) => {
            if (err) {
              console.log(err);
            } else {
              const exclDates = {
                exclDate: moment(foundExclusion.date_served.toString()).format(
                  'YYYY-MM-DD'
                ),
                dobDate: moment(foundExclusion.dob.toString()).format(
                  'YYYY-MM-DD'
                ),
              };
              res.render('./exclusions/edit-exclusion', {
                exclusion: foundExclusion,
                currentUser: req.user,
                dates: exclDates,
                id: exclusion_id,
              });
            }
          }
        );
      } else {
        res.redirect('/unauthorized');
      }
    } else {
      res.redirect('/unauthorized');
    }
  });

  //* /home/:exclusion/confirm_delete GET route
  app.get('/home/:exclusion/confirm_delete', (req, res, next) => {
    // Accessible by Admin or Supervisor users only
    if (req.isAuthenticated()) {
      const exclusion_id = req.params.exclusion;
      if (req.user.role === 'admin' || req.user.role === 'supervisor') {
        Exclusion.findOne(
          { _id: { $eq: exclusion_id } },
          (err, foundExclusion) => {
            if (err) {
              console.log(err);
            } else {
              if (req.user.role === 'admin' || req.user.role === 'supervisor') {
                res.render('./exclusions/delete-confirm', {
                  // Render delete-confirm template
                  exclusion: foundExclusion,
                });
              }
            }
          }
        );
      } else {
        res.redirect('/unauthorized');
      }
    } else {
      res.redirect('/unauthorized');
    }
  });

  //* Delete exclusion GET route
  app.get('/home/:exclusion/delete', async (req, res, next) => {
    // Accessible by Admin or Supervisor users only
    // Delete selected exclusion order from database
    if (req.isAuthenticated()) {
      const exclusion_id = req.params.exclusion;
      if (req.user.role === 'admin' || req.user.role === 'supervisor') {
        await Exclusion.deleteOne({ _id: { $eq: exclusion_id } }) // locate by id
          .then(() => {
            res.redirect('/home');
            console.log(`Exclusion for ${exclusion_id} successfully deleted.`);
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.redirect('/unauthorized');
      }
    } else {
      res.redirect('/unauthorized');
    }
  });

  //* Archive exclusion GET route
  app.get('/archive', (req, res, next) => {
    //Renders a list of all archived exclusion orders, by name.
    // Accessible by Admin and supervisors only
    if (req.isAuthenticated()) {
      const thisUser = {
        loggedInUser: req.user.username,
        loggedInUserRole: req.user.role,
        active: req.user.active,
        role: req.user.role,
      };
      if (thisUser.role === 'admin' || thisUser.role === 'supervisor') {
        Exclusion.find({}, async (err, foundExclusion) => {
          if (err) {
            console.log(err);
          } else {
            archivedExclusionArr = [];
            // Create list of all archived exclusion orders:
            await foundExclusion.forEach((item) => {
              if (item.archived) archivedExclusionArr.push(item);
            });
            Account.findOne(
              { username: { $eq: req.user.username } },
              (err, foundUser) => {
                if (err) {
                  console.log(err);
                } else {
                  if (foundUser.active) {
                    res.render('./archives/archive-list', {
                      exclusions: archivedExclusionArr, // Display only archived orders
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
        }).sort({last_name: 1}); // Sort list in ascending order
      } else {
        res.redirect('/unauthorized');
      }
    } else {
      res.redirect('/');
    }
  });

  //* Archive GET route
  app.get('/archive/:exclusion_id', (req, res, next) => {
    // Displays individual past/archived exclusion order
    // Accessible by admin and supervisor users only
    if (req.isAuthenticated()) {
      const exclusionId = req.params.exclusion_id; // Find user based on ID
      const thisUser = {
        user: req.user.username,
        role: req.user.role,
      };
      if (thisUser.role === 'admin' || thisUser.role === 'supervisor') {
        Exclusion.findOne({ _id: { $eq: exclusionId } }, (err, exclusion) => {
          if (err) {
            console.log(err);
            res.redirect('/error'); // Render /error route
          } else {
            res.render('./archives/archived-exclusion', {
              exclusion: exclusion,
              id: exclusionId,
              user: thisUser,
            });
          }
        });
      } else {
        res.redirect('/unauthorized');
      }
    } else {
      res.redirect('/unauthorized');
    }
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
        // Validate reCAPTCHA
        recaptcha
          .validateRequest(req)
          .then(() => {
            // If validated, continue with passport authentication process:
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
          })
          .catch((err) => {
            // If there is a reCAPTCHA error, redirect to /retry_login route
            console.log('reCAPTCHA was not verified.');
            res.redirect('/retry_login');
          });
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
      recaptcha
        .validateRequest(req)
        .then(() => {
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
        })
        .catch((err) => {
          // If there is a reCAPTCHA error, redirect to /retry_login route
          console.log('reCAPTCHA was not verified.');
          res.redirect('/register');
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
        if (foundUser.active === true) {
          email(
            'User Activated - Exclusion DB',
            `<p>Greetings, ${foundUser.first_name}!</p> ${emailBodies.account_activated_body}`,
            foundUser.username
          ).catch(console.error);
        }
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
      first_name: req.body.first_name,
      last_name: req.body.last_name,
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

    // If other_length has a value, push that value to length instead.
    if (excl.other_length) {
      excl.length = excl.other_length;
    }

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
          first_name: excl.first_name,
          last_name: excl.last_name,
          dob: moment(excl.dob).format('MM/DD/YYYY'),
          other_info: excl.other_info,
          ordinance: excl.ordinance,
          description: excl.description,
          date_served: moment(excl.date_served.toString()).format('MM/DD/YYYY'),
          exp_date: moment(excl.exp_date.toString()).format('MM/DD/YYYY'),
          length: excl.length === 'Lifetime' ? Infinity : excl.length,
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
    let excl = {
      id: req.body.id,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      dob: req.body.dob,
      other_info: req.body.other_info,
      ordinance: req.body.ordinance,
      description: req.body.description,
      date_served: moment(req.body.date_served).format('YYYY-MM-DD'),
      exp_date: req.body.exp_date,
      length: req.body.length,
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
    if (excl.length !== Infinity && excl.length !== null) {
      excl.exp_date = dateServed.addDays(parseInt(excl.length));
    }

    Exclusion.findOne(
      { _id: { $eq: excl.id } },
      async (err, foundExclusion) => {
        if (err) {
          console.log(err);
        } else {
          // Post data to exclusion:
          foundExclusion.first_name = excl.first_name;
          foundExclusion.last_name = excl.last_name;
          (foundExclusion.dob = moment(excl.dob).format('MM/DD/YYYY')),
            (foundExclusion.other_info = excl.other_info);
          foundExclusion.ordinance = excl.ordinance;
          foundExclusion.description = excl.description;
          foundExclusion.date_served = moment(
            excl.date_served.toString()
          ).format('MM/DD/YYYY');
          foundExclusion.exp_date = moment(excl.exp_date.toString()).format(
            'MM/DD/YYYY'
          );
          foundExclusion.length = excl.length;
          foundExclusion.img_url = excl.img_url;
          foundExclusion.signature = excl.signature;

          console.log(foundExclusion);

          await foundExclusion.save((err) => {
            if (err) {
              console.log(err);
            } else {
              console.log(
                foundExclusion.first_name +
                  ' ' +
                  foundExclusion.last_name +
                  ' has been successfully updated.'
              );
              res.redirect('/home');
            }
          });
        }
      }
    );
  });

  //* Archive_exclusion POST route
  app.post('/archive', (req, res, next) => {
    // Archive exclusion - send to /archive list
  });

  app.post('/unarchive', (req, res, next) => {
    // Unarchive exclusion
    //* May not need:
    // Find exclusion and served date
    // Based on served date, determine if this is archived or unarchived...
  });
};
