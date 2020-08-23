const express = require('express');
// TEST
const pool = require('../bin/db');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  pool.query('SELECT NOW()', (err, res1) => {
    console.log(err, res1);
    pool.end();
  });

  res.render('index', { title: 'Test' });
});

module.exports = router;
