const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Ask George' });
});

/* Get submit new bathroom form. */
router.get('/submit', (req, res) => {
  res.render('submit');
});

module.exports = router;
