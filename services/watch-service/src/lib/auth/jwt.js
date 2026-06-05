const jwt = require('jsonwebtoken');
const config = require('../../config');

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { verifyAccessToken };
