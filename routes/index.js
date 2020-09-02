const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Ask George' });
});

/* Submitted bathroom already exists. */
router.get('/submit/already-exists', (req, res) => {
  res.render('already-exists');
});

/* Submitted bathroom added to db. */
router.get('/submit/success', (req, res) => {
  res.render('submit-success');
});

/* Submitted bathroom pending. */
router.get('/submit/pending', (req, res) => {
  res.render('submit-pending');
});

/* Get submit new bathroom form. */
router.get('/submit', (req, res) => {
  res.render('submit');
});

module.exports = router;
