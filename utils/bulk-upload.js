const fs = require('fs').promises;
const path = require('path');
const pool = require('../bin/db');
const logger = require('./logger');

const dropIfQuery = 'DROP TABLE IF EXISTS bathrooms';
const createIndLat = 'CREATE INDEX idx_lat ON bathrooms(lat)';
const createIndLng = 'CREATE INDEX idx_lng ON bathrooms(lng)';

const makeTableQuery = `
CREATE TABLE bathrooms (
  id serial primary key,
  name varchar,
  category varchar,
  address varchar,
  hours varchar,
  handicap varchar,
  formatted_address varchar,
  lat real,
  lng real,
  location_type varchar,
  viewport_ne_lat real,
  viewport_ne_lng real,
  viewport_sw_lat real,
  viewport_sw_lng real,
  place_id varchar,
  plus_code_compound varchar,
  plus_code_global varchar,
  types varchar[]
)
`;

const addBathroomQuery = `
INSERT INTO bathrooms(name, category, address, hours, handicap, formatted_address, 
  lat, lng, location_type, viewport_ne_lat, viewport_ne_lng, viewport_sw_lat, 
  viewport_sw_lng, place_id, plus_code_compound, plus_code_global, types) 
  VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`;

pool.query(dropIfQuery)
  .then(() => pool.query(makeTableQuery))
  .then(() => pool.query(createIndLat))
  .then(() => pool.query(createIndLng))
  .then(() => fs.readFile(path.join(__dirname, '../data/complete.json')))
  .then((data) => {
    const rawData = JSON.parse(data);

    const queries = rawData.map((d) => new Promise((resolve, reject) => {
      const values = [d.name, d.category, d.address, d.hours, d.handicap,
        d.formatted_address, d.geometry.location.lat, d.geometry.location.lng,
        d.geometry.location_type, d.geometry.viewport.northeast.lat,
        d.geometry.viewport.northeast.lng, d.geometry.viewport.southwest.lat,
        d.geometry.viewport.southwest.lng, d.place_id,
        d.plus_code ? d.plus_code.compound_code : null,
        d.plus_code ? d.plus_code.global_code : null,
        d.types];

      pool.query(addBathroomQuery, values)
        .then(() => resolve())
        .catch((error) => {
          logger.error(`error for ${d.formatted_address}`);
          reject(error);
        });
    }));

    return Promise.all(queries);
  })
  .then(() => pool.query('SELECT * FROM bathrooms'))
  .then((res) => logger.info(res.rows))
  .catch((err) => logger.error(err));
