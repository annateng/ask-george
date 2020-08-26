const pool = require('../bin/db');
const logger = require('./logger');

// const query = `
// ALTER TABLE bathrooms
// ADD COLUMN rating int
// DEFAULT 0
// `;

// const query = `
// SELECT *
// FROM information_schema.columns
// WHERE table_name = 'bathrooms'
// `;

// const query = `
// CREATE TABLE users (
//   phone_number varchar primary key,
//   city varchar,
//   state varchar,
//   country varchar,
//   zip varchar
// )
// `;

// const query = `
// CREATE TABLE texts_received (
//   id serial primary key,
//   phone_number varchar,
//   text varchar,
//   received_at timestamp DEFAULT NOW(),
//   CONSTRAINT fk_user
//     FOREIGN KEY(phone_number) REFERENCES users(phone_number)
// )`;

const query = `
SELECT *
FROM users
`;

pool.query(query)
  .then((res) => logger.info(res.rows))
  .catch((err) => logger.error(err));
