require('dotenv').config();
const { Client } = require('@googlemaps/google-maps-services-js');
// const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
const logger = require('../utils/logger');
const pool = require('../bin/db');

const client = new Client({});

const checkUserQuery = `
SELECT COUNT(phone_number)
FROM users
WHERE phone_number = $1
`;

const newUserQuery = `
INSERT INTO users(phone_number, city, state, country, zip)
VALUES($1, $2, $3, $4, $5)
`;

const recordTextQuery = `
INSERT INTO texts_received(phone_number, text)
VALUES($1, $2)
`;

const getSearchStr = (txt) => {
  const hasZip = txt.match(/\d{5}$/);
  const hasState = txt.match(/NY \d{5}/i) || txt.match(/,\s*NY/) || txt.match(/\sNY$/);
  const hasCity = txt.match(/New York/i)
    || txt.match(/Brooklyn/i)
    || txt.match(/queens/i)
    || txt.match(/staten island/i)
    || txt.match(/manhattan/i)
    || txt.match(/bronx/i)
    || txt.match(/nyc/i);

  // if zip is included, or city + state, search as is
  if (hasZip || (hasCity && hasState)) return txt.replace(/\s/g, '+');

  // if city but no state, add NY and search
  if (hasCity && !hasState) return `${txt.replace(/\s/g, '+')}+NY`;

  // no city, add New York, NY
  if (!hasCity) return `${txt.replace(/\s/g, '+')}+New+York,+NY`;

  return txt.replace(/\s/g, '+');
};

const formulateResponse = (reqBody) => {
  const {
    Body, From, FromCity, FromState, FromCountry, FromZip,
  } = reqBody;

  return pool.query(checkUserQuery, [From])
    .then((res) => {
      const resCount = res.rows[0].count;
      logger.info(resCount);

      if (resCount === '0') { // create new user
        return pool.query(newUserQuery, [From, FromCity, FromState, FromCountry, FromZip])
          .then(() => pool.query(recordTextQuery, [From, Body]));
      }

      if (resCount.count > 1) { // duplicate phone number - throw error
        throw new Error(`Duplicate phone number in DB for ${From}`);
      }

      // add query to texts received table
      return pool.query(recordTextQuery, [From, Body]);
    })
    .then(() => {
      // query google api for user current location
      const searchStr = getSearchStr(Body);
      logger.info(searchStr); // DEBUG
      return client.geocode({
        params: {
          address: searchStr,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });
    })
    .then((res) => {
      logger.info(res.data.results);
    })
    .catch((err) => { throw err; });
};

module.exports = { formulateResponse };
