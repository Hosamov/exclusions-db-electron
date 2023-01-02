const express = require('express');
const router = express.Router();

const reCAPTCHA = require('recaptcha2');

const recaptcha = new reCAPTCHA({
  siteKey: process.env.SITEKEY, // retrieved during setup
  secretKey: process.env.SECRETKEY, // retrieved during setup
});

//* Login GET route
//* Render login with recaptcha
router.get('/login', (req, res, next) => {
  res.render('./auth/login', {
    recaptcha: recaptcha.formElement(),
  });
});

//* Retry_login GET route
//* Render retry-login template with recaptcha
router.get('/retry_login', (req, res, next) => {
  res.render('./auth/retry-login', {
    recaptcha: recaptcha.formElement(),
  });
});

module.exports = router;
