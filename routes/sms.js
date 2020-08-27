const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const logger = require('../utils/logger');
const { formulateResponse } = require('../controllers/txtController');

const router = express.Router();

/* TWILIO handler - TWILIO will post to this route on incoming text */
router.post('/', (req, res) => {
  const { Body } = req.body;
  logger.info(Body);
  const twiml = new MessagingResponse();

  switch (Body.toLowerCase()) {
    case 'info':
    case 'help':
      // do nothing - twilio handles this response
      return null;
    default:
      return formulateResponse(req.body)
        .then((textBack) => {
          twiml.message(textBack);
          twiml.message('test');

          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        })
        .catch((err) => logger.error(err));
  }
});

module.exports = router;
