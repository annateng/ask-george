const pool = require('../bin/db');
const logger = require('./logger');

pool.query('SELECT types FROM bathrooms WHERE id < 10')
  .then((res) => logger.info(res.rows))
  .catch((err) => logger.error(err));
