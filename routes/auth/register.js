const express = require('express');
const router = express.Router();

const reCAPTCHA = require('recaptcha2');

const recaptcha = new reCAPTCHA({
  siteKey: process.env.SITEKEY, // retrieved during setup
  secretKey: process.env.SECRETKEY, // retrieved during setup
});

//* Register GET route
router.get('/register', (req, res, next) => {
  res.render('./auth/register', {
    recaptcha: recaptcha.formElement('g-recaptcha'),
  });
});

//* Retry_login GET route
router.get('/retry_register', (req, res, next) => {
  res.render('./auth/retry-register', {
    recaptcha: recaptcha.formElement(),
  });
});

router.get('/register_success', (req, res, next) => {
  if (req.isAuthenticated()) {
    res.render('./auth/register-success');
  } else {
    res.redirect('/unauthorized');
  }
});

module.exports = router;
