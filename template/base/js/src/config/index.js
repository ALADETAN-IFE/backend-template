const { connectDB } = require("./db");
const { ENV } = require("./env");

module.exports = {
  connectDB,
  ENV,
};
