const dotenv = require("dotenv");
dotenv.config();

const ENV = {
 PORT: process.env.PORT,
  /*__ALLOWED_ORIGIN__*/
  NODE_ENV: process.env.NODE_ENV,
  /*__MONGO_URI__*/
  /*__JWT_SECRET__*/
};

module.exports = {
  ENV,
};
