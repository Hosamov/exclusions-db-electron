const express = require('express');
const router = express.Router();

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

    let filter = req.query.filter;
    let srt = req.query.srt;

    let query; // Initializer for filter query string
    // Check values to filter properly:
    switch (filter) {
      case 'all':
        console.log('view all.');
        query = {};
        break;
      case 'limited':
        // filter query string for NOT 'infinity' or 'lifetime'
        query = {
          $and: [
            { length: { $ne: 'Infinity' } },
            { length: { $ne: 'Lifetime' } },
          ],
        };
        break;
      case 'lifetime':
        // filter query string for 'infinity' or 'lifetime'
        query = {
          $or: [
            { length: { $eq: 'Infinity' } },
            { length: { $eq: 'Lifetime' } },
          ],
        };
        break;
    }

    // Array of omparison values for sorting:
    sortArr = ['last_name', 'first_name', 'length', 'exp_date'];

    let sortItem = sortArr[0]; // Initialize to 'last_name'

    sortArr.forEach((item) => {
      if (srt === item) sortItem = item;
    });

    if (
      req.user.active &&
      req.user.role !== null &&
      req.user.role !== 'inactive'
    ) {
      // First, ensure current user is active
      Exclusion.find(query, async (err, foundExclusion) => {
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

          if (foundExclusion) {
            res.render('./users/user-home', {
              exclusions: currentExclusionsArr, // Display current exclusions only
              user: thisUser,
              filter: filter,
              sort: srt,
            });
          } else {
            res.redirect('/error');
          }
        }
      }).sort(sortItem); // Sort list in ascending order
    } else {
      res.redirect('/unauthorized');
    }
  } else {
    res.redirect('/login');
  }
});

module.exports = router;
