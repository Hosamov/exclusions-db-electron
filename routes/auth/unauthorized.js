const express = require('express');
const router = express.Router();

//* Unauthorized GET route
//* Renders unauthorized template
router.get('/unauthorized', (req, res, next) => {
  // Most popular GET route XD
  res.render('./auth/unauthorized');
});

module.exports = router;