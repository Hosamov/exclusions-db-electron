const express = require('express');
const router = express.Router();

// Models:
const Account = require('../models/account');


//* Users GET route
//* Renders selectable list of all registered users
router.get('/users', (req, res, next) => {
  // Accessible by Admin users only
  if (req.isAuthenticated()) {
    const thisUser = {
      loggedInUser: req.user.username,
      loggedInUserRole: req.user.role,
      active: req.user.active,
      role: req.user.role,
    };
    if (thisUser.role === 'admin') { // Authorized user: Admin
      Account.find({}, (err, users) => {
        if (err) {
          console.log(err);
          next(err);
        } else {
          res.render('./users/users', {
            users: users,
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
          res.redirect('/users');
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

module.exports = router;
