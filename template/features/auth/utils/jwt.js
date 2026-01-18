const jwt = require("jsonwebtoken");
const { ENV } = require("../config");

async function generateToken(payload) {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, ENV.JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
