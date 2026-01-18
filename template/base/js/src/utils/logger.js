const { ENV } = require("../config/env");
// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

function format(tag, color) {
  return `${color}${colors.bold}[${tag}]${colors.reset}`;
}

function getEnvironment() {
  return ENV.NODE_ENV === "development" || ENV.NODE_ENV === "staging"
    ? "development"
    : ENV.NODE_ENV;
}

console.log(
  format("logger", colors.blue),
  `Logger initialized for ${getEnvironment()} environment.`,
);

const requiredKeys = ENV && Object.keys(ENV).length ? Object.keys(ENV) : [];

const missing = requiredKeys.filter(
  (k) => ENV == null || ENV[k] === undefined || ENV[k] === "",
);

if (missing.length === requiredKeys.length) {
  console.warn(
    format("logger", colors.yellow),
    "ENV values missing — make sure to set up your environment variables correctly.",
  );
} else if (missing.length > 0) {
  console.warn(
    format("logger", colors.yellow),
    `Missing ENV keys: ${missing.join(", ")}`,
  );
}

const logger = {
  log(tag, ...args) {
    if (getEnvironment() !== "development") return;
    console.log(format(tag, colors.blue), ...args);
  },

  info(tag, ...args) {
    if (getEnvironment() !== "development") return;
    console.info(format(tag, colors.cyan), ...args);
  },

  warn(tag, ...args) {
    if (getEnvironment() !== "development") return;
    console.warn(format(tag, colors.yellow), ...args);
  },

  error(tag, ...args) {
    if (getEnvironment() !== "development") return;
    console.error(format(tag, colors.red), ...args);
  },
};

module.exports = logger;
