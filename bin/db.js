const pg = require('pg');
require('dotenv').config();

/**
 * AWS RDS postgres
 */
const dbConfig = {
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  port: process.env.RDS_PORT,
};

module.exports = new pg.Pool(dbConfig);
