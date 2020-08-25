const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const { Client, Status } = require("@googlemaps/google-maps-services-js");

const logger = require('./logger');

// if address string matches #####, assume it contains zip data and search google as is
const hasZip = (str) => {
  const re = /^\d{5}$/;
  const match = str.match(re);
  if (match) {
    logger.info(match); // DEBUG
    return true;
  }
  return false;
};

let rawData;
const complete = [];
const noAddr = [];

fs.readFile(path.join(__dirname, '../data/mappler-data.json'))
  .then((data) => {
    rawData = JSON.parse(data);
    // logger.info(rawData);

    // test
    const client = new Client({});
    const str = 'Washington St & Battery Pl, New York, NY 10004'.replace((/\040/g, '+'));
    client.geocode({
      params: {
        address: str,
        key: process.env.GOOGLE_API_KEY,
      },
    })
      .then((res) => logger.info(res.data.results[0].geometry))
      .catch((err) => { throw err; });
  })
  .catch((err) => logger.error(err));
