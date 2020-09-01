const pool = require('../bin/db');
const logger = require('./logger');
const { deleteDupes } = require('./queries');

// const query = `
// ALTER TABLE bathrooms
// ADD COLUMN rating int
// DEFAULT 0
// `;

// const query = `
// SELECT column_name, data_type
// FROM information_schema.columns
// WHERE table_name = 'users'
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

// const query = `
// SELECT table_name FROM information_schema.tables WHERE table_schema='public'
// AND table_type='BASE TABLE'
// `;

// const query = `
// ALTER TABLE bathrooms
// ADD COLUMN hours_last_updated timestamp
// `;

// const query = `
// ALTER TABLE users
// ADD COLUMN active_loc_lng real,
// ADD COLUMN active_loc_lat select * from users

const query = `
SELECT COUNT(phone_number)
FROM users
WHERE last_active > now() - INTERVAL '3 days'
`
pool.query(query)
  .then((res) => logger.info(res.rows))
  .catch((err) => logger.error(err));
