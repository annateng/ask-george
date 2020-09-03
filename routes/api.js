require('dotenv').config();
const express = require('express');
const { Client } = require('@googlemaps/google-maps-services-js');
// const logger = require('../utils/logger');
const queries = require('../utils/queries');
const pool = require('../bin/db');

const client = new Client({});
const router = express.Router();

const handleSubmit = (req, res) => {
  const { venueName, venueType, hours, streetAddr, city, zip } = req.body;
  // try google api
  const searchStr = `${streetAddr.replace(/\s/g, '+')}+${city.replace(/\s/g, '+')}+NY,+${zip}`;

  client.geocode({
    params: {
      address: searchStr,
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
  })
    .then((googleRes) => {
      const { status, results } = googleRes.data;

      // not found on google - submit a request
      if ((status === 'OK' && results.length > 1) || status !== 'OK') {
        pool.query(queries.submitRequest, [venueName, venueType, searchStr, hours])
          .catch((err) => { throw err; });
        return res.status(202).end();
      }

      // if found on google, check if already exists in DB by place_id
      return pool.query(queries.getByPlaceId, [results[0].place_id])
        .then((existing) => {
          if (existing.rows.length > 0) {
            return res.status(400).send('bathroom already exists');
          }

          // if not found, add new entry to bathrooms table
          const d = results[0];
          const values = [venueName, venueType, streetAddr, hours, null,
            d.formatted_address, d.geometry.location.lat, d.geometry.location.lng,
            d.geometry.location_type, d.geometry.viewport.northeast.lat,
            d.geometry.viewport.northeast.lng, d.geometry.viewport.southwest.lat,
            d.geometry.viewport.southwest.lng, d.place_id,
            d.plus_code ? d.plus_code.compound_code : null,
            d.plus_code ? d.plus_code.global_code : null,
            d.types];

          return pool.query(queries.addBathroom, values)
            .then(() => res.status(201).end())
            .catch((err) => { throw err; });
        })
        .catch((err) => { throw err; });
    })
    .catch((err) => { throw err; });
};

/* New bathroom form submission */
router.post('/submit', async (req, res) => {
  handleSubmit(req, res);
});

/* Feedback form submission */
router.post('/feedback', async (req, res) => {
  const { email, feedback } = req.body;
  return pool.query(queries.addFeedback, [email, feedback])
    .then(() => res.status(201).end())
    .catch((err) => { throw err; });
});

module.exports = router;
