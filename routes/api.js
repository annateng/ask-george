const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

/* Form submission */
router.post('/submit', (req, res) => {
  logger.info(req.body);
  res.status(200);
  res.redirect('/submit');
});

module.exports = router;
