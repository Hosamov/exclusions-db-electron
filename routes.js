const passport = require('passport');
const moment = require('moment');
const reCAPTCHA = require('recaptcha2');

const Account = require('./models/account');
const Exclusion = require('./models/exclusion');

const email = require('./emailer');
const emailBodies = require('./includes/email-bodies');

const recaptcha = new reCAPTCHA({
  siteKey: process.env.SITEKEY, // retrieved during setup
  secretKey: process.env.SECRETKEY, // retrieved during setup
});

module.exports = function (app) {
  //TODO: Change this to a modal window
  //* /user/:users/confirm_delete GET route
  app.get('/users/:user/confirm_delete', (req, res, next) => {
    // Renders delete-confirm template, presents confirmation page prior to
    // deletion of user
    if (req.isAuthenticated()) {
      const user = req.params.user;
      if (req.user.role === 'admin') {
        // Make accessible to admin user only
        res.render('./users/delete-confirm', { user: user });
      }
    } else {
      res.redirect('/unauthorized');
    }
  });

  ////* END USER Routes ////

  ////* BEGIN EXCLUSIONS Routes ////

  //* Image embed Howto GET route - displays how to embed Google Photos for linking
  app.get('/home/img_embed_howto', (req, res, next) => {
    if (req.isAuthenticated()) {
      res.render('./exclusions/image-howto');
    } else {
      res.redirect('/unauthorized');
    }
  });

  // TODO: Render in modal window:
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
                  async (err, foundUser) => {
                    if (err) {
                      console.log(err);
                    } else {
                      if (foundUser.active) {
                        foundUser.loggedIn = true;
                        await foundUser.save((err) => {
                          if (err) {
                            console.log(err);
                            res.next(err); // err route
                          } else {
                            console.log(
                              `User, ${foundUser.username} has logged in.`
                            );
                            res.redirect('/home');
                          }
                        });
                      } else {
                        console.log(
                          `User ${foundUser.username} is not active and cannot login.`
                        );
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

  //* Logout POST route https://www.passportjs.org/concepts/authentication/logout/
  app.post('/logout', (req, res, next) => {
    if (req.isAuthenticated()) {
      const loggedInUser = {
        username: req.user.username,
      };
      Account.findOne(
        { username: { $eq: loggedInUser.username } },
        async (err, foundUser) => {
          foundUser.loggedIn = false;
          await foundUser.save((err) => {
            if (err) {
              console.log(err);
              res.next(err); // err route
            } else {
              //Note: Passport 0.6.0^ requires promise cb for req.logout()
              req.logout((err) => {
                if (err) {
                  return next(err);
                } else {
                  console.log(`User, ${loggedInUser.username} has logged out.`);
                  res.redirect('/');
                }
              });
            }
          });
        }
      );
    } else {
      res.redirect('/'); // No need to logout - already logged out...
    }
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
              res.redirect('/retry_register');
            } else {
              passport.authenticate('local')(req, res, () => {
                console.log('Registration successful.');
                Account.findOne(
                  { username: username },
                  async (err, foundUser) => {
                    if (err) {
                      console.log(err);
                    } else {
                      foundUser.first_name = firstName;
                      foundUser.last_name = lastName;
                      foundUser.loggedIn = false;
                      if (userKey === process.env.ADMIN_KEY) {
                        // Check if (admin) userkey has been inputted, and if it matches
                        console.log('User Key Accepted!');
                        foundUser.role = 'admin';
                        foundUser.active = true;
                      } else if (userKey === process.env.SUPV_KEY) {
                        console.log('User Key Accepted!');
                        foundUser.role = 'supervisor';
                        foundUser.active = true;
                      } else if (userKey === process.env.USER_KEY) {
                        console.log('User Key Accepted!');
                        foundUser.role = 'user';
                        foundUser.active = true;
                      } else {
                        console.log('Invalid user key/no key entered.');
                        foundUser.role = null;
                        foundUser.active = false;
                      }
                      await foundUser.save((err) => {
                        if (err) {
                          console.log(err);
                          res.next(err); // err route
                        } else {
                          //* Send registration email to new user:
                          email(
                            'Successful Registration - Exclusions DB',
                            `<p>Congrats, ${firstName}!</p> ${emailBodies.register_body}`,
                            username
                          ).catch(console.error);
                          //* Send registration email to site admin:
                          email(
                            'New User Registered - Exclusions DB',
                            `<p>Greetings, Admin!</p> ${emailBodies.new_account_admin} new user: ${foundUser.username} (${foundUser.first_name} ${foundUser.last_name})`,
                            `hosamov@hotmail.com`
                          ).catch(console.error);
                          console.log(
                            `New user, ${foundUser.first_name} ${foundUser.last_name} has been registered...`
                          );
                          res.redirect('/register_success');
                        }
                      });
                    }
                  }
                );
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
        if (
          foundUser.active === false &&
          (userInfo.active === 'on' || userInfo.active === 'true')
        ) {
          //* Send activation email:
          email(
            'Account Activated - Exclusions DB',
            `<p>Greetings, ${foundUser.first_name}!</p> 
             ${emailBodies.account_activated_body}`,
            foundUser.username
          ).catch(console.error);
          foundUser.active = true;
        }
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
      super_title: req.body.super_title,
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
          foundExclusion.super_title = excl.super_title;

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
};
