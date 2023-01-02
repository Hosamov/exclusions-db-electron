const express = require('express');
const router = express.Router();

// Models:
const Account = require('../models/account');

//* Users GET route
router.get('/users', (req, res, next) => {
  // Accessible by Admin users only
  // Displays a list of all users, their roles and active status
  if (req.isAuthenticated()) {
    const thisUser = {
      loggedInUser: req.user.username,
      loggedInUserRole: req.user.role,
      active: req.user.active,
      role: req.user.role,
    };
    if (thisUser.loggedInUser === 'admin') { // Authorized user: Admin
      Account.find({}, (err, users) => {
        if (err) {
          console.log(err);
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
router.get('/users/:user', (req, res, next) => {
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
    // Authorized: Admin or logged in user, if active:
    if (
      thisUser.loggedInUser === 'admin' ||
      (thisUser.loggedInUser === user && thisUser.active)
    ) {
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
    res.redirect('/login');
  }
});

//* /user/:users/edit_user GET route
router.get('/users/:user/edit_user', (req, res, next) => {
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
    // Authorized: Admin or logged in user, if active:
    if (
      thisUser.loggedInUser === 'admin' ||
      (thisUser.loggedInUser === user && thisUser.active)
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
    res.redirect('/login');
  }
});

//* /user/:users/DELETE_user GET route
router.get('/users/:user/delete_user', async (req, res, next) => {
  //* Delete registered user from DB
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
        });
    } else {
      res.redirect('/unauthorized');
    }
  } else {
    res.redirect('/login');
  }
});

module.exports = router;
