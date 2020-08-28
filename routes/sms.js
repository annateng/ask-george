require('dotenv').config();
const express = require('express');
// const { MessagingResponse } = require('twilio').twiml;
const twilio = require('twilio');
const pool = require('../bin/db');
const logger = require('../utils/logger');
const queries = require('../utils/queries');
const { newSearch, nextPage, checkActive } = require('../controllers/txtController');

const router = express.Router();

const sid = process.env.NODE_ENV === 'production' ? process.env.TWILIO_SID : process.env.TWILIO_TEST_SID;
const auth = process.env.NODE_ENV === 'production' ? process.env.TWILIO_AUTH : process.env.TWILIO_TEST_AUTH;
const client = twilio(sid, auth);

const helpText = `Welcome to Let-Me-P NYC!
 
Text us your address and we'll send you the closest restrooms to you.
Try an an intersection ("45th st & 8th Ave") or a street address ("150 Park Ave, Manhattan").

1-325-8-LET-ME-P
1-325-853-8637
bit.ly/31xcOVI`;

const getResponse = (body) => {
  const {
    Body, From, FromCity, FromState, FromCountry, FromZip,
  } = body;

  // check if first time user
  return pool.query(queries.checkUserQuery, [From])
    .then((res) => {
      const resCount = res.rows[0].count;

      // duplicate phone number: throw error
      if (resCount.count > 1) {
        throw new Error(`Duplicate phone number in DB for ${From}`);
      }

      // user not found: create new user
      if (resCount === '0') {
        return pool.query(queries.newUserQuery, [From, FromCity, FromState, FromCountry, FromZip])
          .then(() => {
            // record text
            pool.query(queries.recordTextQuery, [From, Body]);
            // update last active
            pool.query(queries.updateActive, [From]);
            return helpText;
          });
      }

      // add query to texts received table
      pool.query(queries.recordTextQuery, [From, Body]);
      pool.query(queries.updateActive, [From]);
      return checkActive(From)
        .then((isActive) => {
          // if user said "Next" and he's active, get next page of results
          if (isActive && Body.toLowerCase().trim() === 'next') {
            return pool.query(queries.getPageNo, [From])
              .then((pageNo) => nextPage(pageNo.rows[0].next_page_no, From));
          }
          // if user said "next" and he's not active, send him the help message
          if (!isActive && Body.toLowerCase().trim() === 'next') {
            return helpText;
          }

          // else, initiate new search
          return newSearch(Body, From);
        });
    })
    .catch((err) => logger.error(err));
};

/* TWILIO handler - TWILIO will post to this route on incoming text */
router.post('/', (req) => {
  const { Body, From } = req.body;
  // logger.info(Body.toLowerCase());
  // const twiml = new MessagingResponse();

  switch (Body.toLowerCase().trim()) {
    // twilio keywords: do nothing, messaging service handles
    case 'info':
    case 'help':
    case 'stop':
    case 'start':
    case 'unstop':
      break;
    default:
      getResponse(req.body)
        .then((textBack) => {
          logger.info(textBack);
          return client.messages.create({
            body: textBack,
            from: process.env.NODE_ENV !== 'production' ? '+15005550006' : '+13258538637',
            to: From,
          });
        })
        .then((message) => {
          logger.info(message.sid);
        });
  }
});

module.exports = router;
