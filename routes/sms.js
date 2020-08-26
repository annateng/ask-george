const express = require('express');
const { MessagingResponse } = require('twilio').twiml;

const router = express.Router();

/* GET users listing. */
router.post('/', (req, res) => {
  const twiml = new MessagingResponse();

  twiml.message('test message');

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

module.exports = router;
