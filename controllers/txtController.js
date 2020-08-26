require('dotenv').config();
const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
const logger = require('../utils/logger');

client.messages
  .create({
    body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
    from: '+16692737835',
    to: '+17817896616',
  })
  .then((message) => {
    logger.info('got here');
    logger.info(message.sid);
  })
  .catch((err) => logger.error(err));
