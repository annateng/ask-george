const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const { Client } = require('@googlemaps/google-maps-services-js');
const logger = require('./logger');

const filePath = process.argv.length > 2 ? process.argv[2] : '../data/mappler-data.json';

const complete = [];
const noAddr = [];
const badStatus = [];
const multiResults = [];

let numRequests = 0;

// if address string matches #####, assume it contains zip data and search google as is
const hasZip = (str) => {
  const re = /\d{5}/;
  const match = str.match(re);
  if (match) {
    // logger.info(match); // DEBUG
    return true;
  }
  return false;
};

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const handleApiData = async (d, res) => {
  const { status, results } = res.data;
  if (status === 'OK') {
    // logger.info(results.length);
    if (results.length > 1) {
      multiResults.push(d);
    } else {
      const sanitizedEntry = {
        ...d,
        ...results[0],
      };

      complete.push(sanitizedEntry);
    }
  } else {
    badStatus.push(d);
  }

  // logger.info('got here');
};

// try api calls until status != 429
const tryApi = async (client, formattedAddr) => {
  let numTries = 0;
  /* eslint-disable no-await-in-loop */
  while (numTries < 3) {
    numRequests += 1;
    numTries += 1;
    try {
      const res = await client.geocode({
        params: {
          address: formattedAddr,
          key: process.env.GOOGLE_MAPS_API_KEY,
          rate: { limit: 50 },
        },
        timeout: 0,
      });
      return res;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.status && e.response.data.status === 'OVER_QUERY_LIMIT') {
        await sleep(120000);
      } else {
        throw e;
      }
    }
  }
  /* eslint-enable no-await-in-loop */

  throw new Error(`3 tries exceeded for ${formattedAddr}`);
};

const getApiPromise = (d, client) => new Promise((resolve, reject) => {
  const { address, name } = d;
  let searchStr;
  if (address.length === 0) {
    searchStr = `${name.replace(/\s/g, '+')}+New+York,+NY`;
  } else {
    const formattedAddr = hasZip(address)
      ? address.replace(/\s/g, '+')
      : `${address.replace(/\s/g, '+')}+New+York,+NY`;

    searchStr = `${name.replace(/\s/g, '+')}+${formattedAddr}`;
  }

  tryApi(client, searchStr)
    .then((res) => {
      handleApiData(d, res);
      resolve();
    }).catch((err) => {
      reject(err);
    });
});

// main script
fs.readFile(path.join(__dirname, filePath))
  .then((data) => {
    const rawData = JSON.parse(data);
    // logger.info(rawData);

    const client = new Client({});

    const promiseArr = rawData.map((d) => getApiPromise(d, client));

    // logger.info(promiseArr.length);

    Promise.all(promiseArr).then(() => {
      logger.info(`
      Complete: ${complete.length}
      No Address: ${noAddr.length}
      Bad Status: ${badStatus.length}
      Multiple Results: ${multiResults.length}
      Total: ${complete.length + noAddr.length + badStatus.length + multiResults.length}`);

      fs.writeFile(
        path.join(__dirname, '../data/complete.json'),
        JSON.stringify(complete),
        { flag: 'w' },
        (err) => {
          if (err) throw err;
          else logger.info('complete written successfully');
        },
      );

      fs.writeFile(
        path.join(__dirname, '../data/no-addr.json'),
        JSON.stringify(noAddr),
        { flag: 'w' },
        (err) => {
          if (err) throw err;
          else logger.info('no-addr written successfully');
        },
      );

      fs.writeFile(
        path.join(__dirname, '../data/bad-status.json'),
        JSON.stringify(badStatus),
        { flag: 'w' },
        (err) => {
          if (err) throw err;
          else logger.info('bad-status written successfully');
        },
      );

      fs.writeFile(
        path.join(__dirname, '../data/multi-res.json'),
        JSON.stringify(multiResults),
        { flag: 'w' },
        (err) => {
          if (err) throw err;
          else logger.info('multi-res written successfully');
        },
      );
    }).catch((err) => logger.error(err, numRequests));
  })
  .catch((err) => logger.error(err));
