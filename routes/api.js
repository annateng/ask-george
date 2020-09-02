const express = require('express');
const logger = require('../utils/logger');
const { handleSubmit } = require('../controllers/submitController');

const router = express.Router();

/* Form submission */
router.post('/submit', async (req, res) => {
  handleSubmit(req, res);
});

module.exports = router;
