const express = require('express');
const router = express.Router();

// Models:
const Account = require('../models/account');

//* Users GET route
//* Renders selectable list of all registered users
router.get('/users', (req, res, next) => {
  // Accessible by Admin users only
  if (req.isAuthenticated()) {
    const store = req.sessionStore; // Look in Account.find:

    const thisUser = {
      loggedInUser: req.user.username,
      loggedInUserRole: req.user.role,
      active: req.user.active,
      role: req.user.role,
    };

    // Authorized user: Admin
    if (thisUser.role === 'admin') {
      Account.find({}, async (err, users) => {
        if (err) {
          console.log(err);
          next(err);
        } else {
          //* Check sessions:
          // Initialize arrays for checking sessions:
          const usernameArr = [];
          const sessionsArr = [];

          // Get and store each registered username (email)
          users.forEach((user) => {
            usernameArr.push(user.username);
          });

          // https://stackoverflow.com/questions/14018761/view-all-currently-active-sessions-in-express-js
          await store.all((err, sessions) => {
            if (err) {
              console.log(err);
            } else {
              if (sessions !== null) {
                for (let sid in sessions) {
                  let ses = JSON.parse(store.sessions[sid]);
                  let sesUser = ses.passport.user;
                  if (usernameArr.includes(sesUser)) {
                    sessionsArr.push(sesUser.toString());
                  }
                }
                //* Render the /users/users template:
                res.render('./users/users', {
                  users: users,
                  currentUser: thisUser,
                  sesUsers: sessionsArr, // For displaying who's logged in currently
                });
              } else {
                console.log('No user sessions...');
              }
            }
          });
        }
      });
    } else {
      res.redirect('/unauthorized');
    }
  } else {
    res.redirect('/login');
  }
});

//* /users/:users GET route
//* Renders stats of individual user selected
router.get('/users/:user', (req, res, next) => {
  const user = req.params.user;

  if (req.isAuthenticated()) {
    const thisUser = {
      loggedInUser: req.user.username,
      loggedInUserRole: req.user.role,
      active: req.user.active,
      role: req.user.role,
    };
    // Authorized: Admin or logged in user, if active:
    if (
      thisUser.role === 'admin' ||
      (thisUser.loggedInUser === user && thisUser.active)
    ) {
      Account.find({ username: { $eq: user } }, (err, foundUser) => {
        if (err) {
          console.log(err);
          next(err);
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
    res.redirect('/login');
  }
});

//* /user/:users/edit_user GET route
//* Renders a form for editing the selected user
router.get('/users/:user/edit_user', (req, res, next) => {
  const user = req.params.user;

  if (req.isAuthenticated()) {
    const thisUser = {
      loggedInUser: req.user.username,
      loggedInUserRole: req.user.role,
      active: req.user.active,
      role: req.user.role,
    };
    // Authorized: Admin or logged in user, if active:
    if (
      thisUser.role === 'admin' ||
      (thisUser.loggedInUser === user && thisUser.active)
    ) {
      Account.find({ username: { $eq: user } }, (err, foundUser) => {
        if (err) {
          console.log(err);
          next(err);
        } else {
          console.log(foundUser);
          res.render(`./users/edit-user`, {
            user: foundUser,
            currentUser: thisUser,
          }); // Note: logged in user (unless an admin) can edit password only
        }
      });
    } else {
      res.redirect('/unauthorized');
    }
  } else {
    res.redirect('/login');
  }
});

//* /user/:users/DELETE_user GET route
//* After deleting user, redirects to /users GET route
router.get('/users/:user/delete_user', async (req, res, next) => {
  if (req.isAuthenticated()) {
    const user = req.params.user;
    // Authorized: Admin only
    if (req.user.role === 'admin') {
      await Account.deleteOne({ username: user })
        .then(() => {
          res.redirect(`/users/${user}/delete_success`);
          console.log(`Account for ${user} successfully deleted.`);
        })
        .catch((err) => {
          console.log(err);
          next(err);
        });
    } else {
      res.redirect('/unauthorized');
    }
  } else {
    res.redirect('/login');
  }
});

//* /user/:users/delete_success GET route
//* Renders users/delete-success template
router.get('/users/:user/delete_success', (req, res, next) => {
  if (req.isAuthenticated()) {
    const user = req.params.user;
    // Make accessible to admin user only
    if (req.user.role === 'admin') {
      res.render('./users/delete-success', { user: user });
    }
  } else {
    res.redirect('/unauthorized');
  }
});

module.exports = router;
