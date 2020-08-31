require('dotenv').config();
const express = require('express');
// const { MessagingResponse } = require('twilio').twiml;
const twilio = require('twilio');
const logger = require('../utils/logger');
const { getResponse } = require('../controllers/txtController');

const router = express.Router();

const sid = process.env.NODE_ENV === 'production' ? process.env.TWILIO_SID : process.env.TWILIO_TEST_SID;
const auth = process.env.NODE_ENV === 'production' ? process.env.TWILIO_AUTH : process.env.TWILIO_TEST_AUTH;
const client = twilio(sid, auth);

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
