const dotenv = require("dotenv");
dotenv.config();

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

function format(tag, color) {
  return `${color}${colors.bold}[${tag}]${colors.reset}`;
}

const validateEnv = (env) => {
  const missing = Object.entries(env)
    .filter(([, value]) => value === undefined || value === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error(
      format("env", colors.red),
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    console.error(
      format("env", colors.red),
      "Please update your .env file and restart the server.",
    );
    process.exit(1);
  }
};

const ENV = {
  PORT: process.env.PORT,
  /*__ALLOWED_ORIGIN__*/
  NODE_ENV: process.env.NODE_ENV,
  /*__MONGO_URI__*/
  /*__JWT_SECRET__*/
};

validateEnv(ENV);

module.exports = {
  ENV,
};
