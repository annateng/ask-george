require('dotenv').config();
const express = require('express');
// const { MessagingResponse } = require('twilio').twiml;
const client = require('twilio')(process.env.TWILIO_TEST_SID, process.env.TWILIO_TEST_AUTH);
const logger = require('../utils/logger');
const { formulateResponse } = require('../controllers/txtController');

const router = express.Router();

const fromNumber = process.env.NODE_ENV !== 'production' ? '+15005550006' : '+13258538637';

/* TWILIO handler - TWILIO will post to this route on incoming text */
router.post('/', (req) => {
  const { Body, From } = req.body;
  logger.info(Body.toLowerCase());
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
      formulateResponse(req.body)
        .then((textBack) => {
          logger.info(textBack);
          client.messages.create({
            body: textBack,
            from: fromNumber,
            to: From,
          }).then((message) => logger.info(message.sid));
        })
        .catch((err) => logger.error(err));
  }
});

module.exports = router;
