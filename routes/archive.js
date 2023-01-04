const express = require('express');
const router = express.Router();

// Models:
const Account = require('../models/account');
const Exclusion = require('../models/exclusion');

//* Archive exclusion GET route
//* Renders list of all archived exclusions
router.get('/archive', (req, res, next) => {
  if (req.isAuthenticated()) {
    const thisUser = {
      loggedInUser: req.user.username,
      loggedInUserRole: req.user.role,
      active: req.user.active,
      role: req.user.role,
    };
    // Authorized: Admin & Supervisor, if active
    if (
      thisUser.role === 'admin' ||
      (thisUser.role === 'supervisor' && thisUser.active)
    ) {
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
      }).sort({ last_name: 1 }); // Sort list in ascending order
    } else {
      res.redirect('/unauthorized');
    }
  } else {
    res.redirect('/');
  }
});

//* Archive/ExclusionId/Unarchive GET route
//* Pushes the exclusion back into the main list from the archives
router.get('/archive/:exclusion_id/unarchive/', (req, res, next) => {
  const exclId = req.params.exclusion_id;
  if(req.isAuthenticated()) {
    if(req.user.role === 'admin') {
      Exclusion.findOne({_id: {$eq: exclId}}, (err, foundExclusion) => {
        foundExclusion.archived = false;
        foundExclusion.exp_date = 'Lifetime';
        foundExclusion.save((err) => {
          if(err) {
            console.log(err);
          } else {
            console.log('Exclusion for ' + exclId + " successfully reinstated.");
            res.redirect('/home');
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
