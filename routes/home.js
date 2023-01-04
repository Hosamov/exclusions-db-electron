const express = require('express');
const router = express.Router();
const moment = require('moment');

// Models:
const Exclusion = require('../models/exclusion');

// Helpers:
const archiveHelper = require('../includes/archive-helper');

//* Home GET route (for logged-in users) - Displays list of all active exclusions
router.get('/home', async (req, res, next) => {
  if (req.isAuthenticated()) {
    const thisUser = {
      loggedInUser: req.user.username,
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
      thisUser.active &&
      thisUser.role !== null &&
      thisUser.role !== 'inactive'
    ) {
      // First, ensure current user is active
      Exclusion.find(query, async (err, foundExclusion) => {
        if (err) {
          console.log(err);
          next(err);
        } else {
          const currentExclusionsArr = []; // Holds unarchived exclusions
          await foundExclusion.forEach((item) => {
            // Check all unarchived exclusions
            if (!item.archived) {
              //* Verify active or past exclusion using archiveHelper:
              if (
                item.exp_date !== 'Invalid date' &&
                item.exp_date !== 'Infinity' &&
                item.exp_date !== 'Lifetime' && 
                item.length !== 'Lifetime'
              ) {
                item.archived = archiveHelper(item.exp_date); // Returns Boolean
              }

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
          // Render the correct template:
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

//* Add_new_exclusion GET route
//* Renders an exclusion creation form
//* Note: route name due to params (see next routes)
router.get('/add_new_exclusion', (req, res, next) => {
  if (req.isAuthenticated()) {
    const thisUser = {
      username: req.user.username,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      role: req.user.role,
      active: req.user.active,
    };
    // Authorized: Admin or supervisor, if active
    if (
      thisUser.role === 'admin' ||
      (thisUser.role === 'supervisor' && thisUser.active)
    ) {
      Exclusion.find({}, (err, exclusions) => {
        if (err) {
          console.log(err);
          next(err);
        } else {
          res.render('./exclusions/new-exclusion', { user: thisUser });
        }
      });
    } else {
      res.redirect('/unauthorized');
    }
  } else {
    res.redirect('/');
  }
});

//* Home/selected exclusion GET route -
//* Renders selected exclusion
router.get('/home/:exclusion_id', (req, res, next) => {
  const exclusionId = req.params.exclusion_id; // Find user based on ID
  if (req.isAuthenticated()) {
    const thisUser = {
      user: req.user.username,
      role: req.user.role,
      active: req.user.active,
    };
    // Accessible by all active users
    if (
      thisUser.active &&
      thisUser.role !== null &&
      thisUser.role !== 'inactive'
    ) {
      Exclusion.findOne({ _id: { $eq: exclusionId } }, (err, exclusion) => {
        if (err) {
          console.log(err);
          next(err);
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
    res.redirect('/');
  }
});

//* Edit exclusion GET route
//* Renders edit form for selected exclusion
router.get('/home/:exclusion/edit', (req, res, next) => {
  const exclusion_id = req.params.exclusion;
  console.log(exclusion_id);
  if (req.isAuthenticated()) {
    // Authorized: Admin & supervisor, if active
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

//* Delete exclusion GET route
//* Redirects to /home GET route after deleting selected exclusion
router.get('/home/:exclusion/delete', async (req, res, next) => {
  if (req.isAuthenticated()) {
    const exclusion_id = req.params.exclusion;
    // Authorized: Admin & Supervisor, if active
    if (
      req.user.role === 'admin' ||
      (req.user.role === 'supervisor' && req.user.active)
    ) {
      await Exclusion.deleteOne({ _id: { $eq: exclusion_id } }) // locate by id
        .then(() => {
          res.redirect(`/home/${exclusion_id}/delete_success`);
          console.log(`Exclusion for ${exclusion_id} successfully deleted.`);
        })
        .catch((err) => {
          console.log(err);
          next(err);
        });
    } else {
      res.redirect('/unauthorized');
    }
  } else {
    res.redirect('/');
  }
});

//* /user/:users/delete_success GET route
//* Render exclusions/delete-success template
router.get('/home/:id/delete_success', (req, res, next) => {
  if (req.isAuthenticated()) {
    const exclusionId = req.params.id;
    // Make accessible to admin user only
    if (req.user.role === 'admin') {
      res.render('./exclusions/delete-success', { id: exclusionId });
    }
  } else {
    res.redirect('/unauthorized');
  }
});

//* Home/ExclusionId/Archive GET route
//* Moves exclusion from main list to archived list
router.get('/home/:exclusion_id/archive', (req, res, next) => {
  const exclId = req.params.exclusion_id;
  if(isAuthenticated()) {
    if(req.user.role === 'admin') {
      Exclusion.findOne({_id: {$eq: exclId}}, (err, foundExclusion) => {
        foundExclusion.exp_date = new Date();
        foundExclusion.save((err) => {
          if(err) {
            console.log(err);
          } else {
            console.log('Exclusion ' + exclId + " successfully archived.");
            res.redirect('/archive');
          }
        })
      })
    } else {
      res.redirect('/unauthorized');
    }
  } else {
    res.redirect('/');
  }
});

module.exports = router;
