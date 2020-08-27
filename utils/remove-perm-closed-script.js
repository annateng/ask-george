require('dotenv').config();
const { Client } = require('@googlemaps/google-maps-services-js');
const pool = require('../bin/db');
const logger = require('./logger');
const { sleep } = require('./helpers');

const client = new Client({});
const toRemove = [];

// try api calls until status != 429
const tryApi = async (r) => {
  let numTries = 0;
  /* eslint-disable no-await-in-loop */
  while (numTries < 3) {
    numTries += 1;
    try {
      return client.placeDetails({
        params: {
          key: process.env.GOOGLE_MAPS_API_KEY,
          place_id: r.place_id,
          rate: { limit: 50 },
        },
        timeout: 0,
      });
    } catch (e) {
      logger.error(e);
      if (e.response && e.response.data && e.response.data.status && e.response.data.status === 'OVER_QUERY_LIMIT') {
        logger.info('got here');
        await sleep(30000);
      } else {
        throw e;
      }
    }
  }
  /* eslint-enable no-await-in-loop */

  throw new Error(`3 tries exceeded for ${r.name}`);
};

pool.query('SELECT id, place_id FROM bathrooms')
  .then((res) => {
    const promArr = res.rows.map((r) => new Promise((resolve, reject) => {
      tryApi(r)
        .then((det) => {
          if (det.data.result.business_status === 'CLOSED_PERMANENTLY') toRemove.push(r.id);
          resolve();
        })
        .catch((err) => reject(err));
    }));

    return Promise.all(promArr);
  })
  .then(() => {
    const params = [];

    for (let i = 0; i < toRemove.length; i += 1) {
      params.push(`$${i + 1}`);
    }

    return pool.query(`DELETE FROM bathrooms WHERE id IN (${params.join(',')})`, toRemove);
  })
  .then((res) => logger.info(res))
  .catch((err) => logger.error(err));
