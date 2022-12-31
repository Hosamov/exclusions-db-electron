const express = require('express');
const router = express.Router();
// const passport = require('passport');

// Models:
const Account = require('../models/account');
const Exclusion = require('../models/exclusion');

// Helpers:
const archiveHelper = require('../includes/archive-helper');

//* Home GET route (for logged-in users) - Displays list of all active exclusions
router.get('/home', async (req, res, next) => {
  if (req.isAuthenticated()) {
    const thisUser = {
      loggedInUser: req.user.username,
      loggedInUserRole: req.user.role,
      active: req.user.active,
      role: req.user.role,
    };
    if (req.user.active) {
      // First, ensure current user is active
      // TODO: Working here now - Filter based on choice in /home route
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
        // TODO: Sort based on choice from /home route
      }).sort({ last_name: 1 }); // Sort list in ascending order
    } else {
      res.redirect('/unauthorized');
    }
  } else {
    res.redirect('/unauthorized');
  }
});

module.exports = router;
