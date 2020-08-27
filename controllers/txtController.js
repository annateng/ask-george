require('dotenv').config();
const { Client } = require('@googlemaps/google-maps-services-js');
const { BitlyClient } = require('bitly');
const logger = require('../utils/logger');
const {
  checkUserQuery, newUserQuery, recordTextQuery, selectNearest, updateHours, updateName,
} = require('../utils/queries');
const pool = require('../bin/db');

const client = new Client({});
const bitlyClient = new BitlyClient(process.env.BITLY_ACCESS_TOKEN, {});

const notFoundStr = 'Address not found.';
const multiResStr = 'Multiple address matches. Please be more specific.';

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

      // user not found: create new user
      if (resCount === '0') {
        return pool.query(newUserQuery, [From, FromCity, FromState, FromCountry, FromZip])
          .then(() => pool.query(recordTextQuery, [From, Body]));
      }

      // duplicate phone number: throw error
      if (resCount.count > 1) {
        throw new Error(`Duplicate phone number in DB for ${From}`);
      }

      // else: add query to texts received table
      return pool.query(recordTextQuery, [From, Body]);
    })
    .then(() => {
      // query google api for user current location
      const searchStr = getSearchStr(Body);
      // logger.info(searchStr); // DEBUG

      return client.geocode({
        params: {
          address: searchStr,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });
    })
    .then((res) => {
      // logger.info(res.data.results); // DEBUG
      // throw err to break out of primise chain here
      if (res.data.status !== 'OK') throw new Error(notFoundStr);
      if (res.data.results.length > 1) throw new Error(multiResStr);

      const locData = res.data.results[0];
      const { lng, lat } = locData.geometry.location;

      return pool.query(selectNearest, [lat, lng, 5, 0]);
    })
    .then((res) => {
      const placeDetailPromiseArr = res.rows.map((r) => new Promise((resolve, reject) => {
        client.placeDetails({
          params: {
            key: process.env.GOOGLE_MAPS_API_KEY,
            place_id: r.place_id,
          },
        })
          .then((placeDetails) => {
            logger.info(placeDetails.data.result);
            // account for temp closing
            //  eslint-disable-next-line no-param-reassign
            if (placeDetails.data.result.business_status === 'CLOSED_TEMPORARILY') r.hours = 'Temporarily Closed';
            resolve({
              api_hours: placeDetails.data.result.opening_hours,
              api_name: placeDetails.data.result.name,
              business_status: placeDetails.data.result.business_status,
              url: placeDetails.data.result.url,
              ...r,
            });
          })
          .catch((err) => reject(err));
      }));

      return Promise.all(placeDetailPromiseArr);
    })
    .then((details) => {
      // logger.info('DETAILS', details); // DEBUG
      // update hours in database
      details.forEach((det) => {
        if (det.api_hours) {
          const hoursString = det.api_hours.weekday_text.join('\n');
          pool.query(updateHours, [hoursString, det.id]);
          det.hours = hoursString; // eslint-disable-line no-param-reassign
        }
      });

      // update name in database
      details.forEach((det) => {
        if (!det.name && det.api_name) {
          pool.query(updateName, [det.api_name, det.id]);
        }
      });

      // create output string
      const outputPromiseArr = details.map((det) => new Promise((resolve, reject) => {
        // google api goes monday -> sunday. js goes sunday -> saturday
        const dayNo = (new Date().getDay() + 5) % 6;
        // logger.info(dayNo, new Date().getDay());

        const name = det.name ? det.name : det.api_name;
        const distance = det.distance < 0.1 ? '<0.1 mi' : `${Math.trunc(det.distance)}.${Math.trunc(det.distance * 10) % 10} mi`;
        const type = det.category ? det.category : 'na';

        let hours;
        if (det.api_hours) hours = det.api_hours.weekday_text[dayNo].replace(':', ',');
        else if (det.hours) hours = det.hours;
        else hours = 'na';

        bitlyClient.shorten(det.url)
          .then((shortUrl) => {
            // logger.info(shortUrl);

            resolve(`
ID: ${det.id}
Name: ${name}
Type: ${type}
Distance: ${distance}
Hours: ${hours}
Directions: ${shortUrl.id}
          `.trim());
          })
          .catch((err) => reject(err));
      }));

      return Promise.all(outputPromiseArr);
    })
    .then((outputStrs) => outputStrs.join('\n\n'))
    .catch((err) => {
      if (err.message === notFoundStr || err.message === multiResStr) return err.message;
      throw err;
    });
};

module.exports = { formulateResponse };
