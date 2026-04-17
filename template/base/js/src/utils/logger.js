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

function shouldLog(level) {
  if (level === "log") {
    return getEnvironment() === "development";
  }

  return true;
}

console.log(
  format("logger", colors.blue),
  `Logger initialized for ${getEnvironment()} environment.`,
);

const logger = {
  log(tag, ...args) {
    if (!shouldLog("log")) return;
    console.log(format(tag, colors.blue), ...args);
  },

  info(tag, ...args) {
    if (!shouldLog("info")) return;
    console.info(format(tag, colors.cyan), ...args);
  },

  warn(tag, ...args) {
    if (!shouldLog("warn")) return;
    console.warn(format(tag, colors.yellow), ...args);
  },

  error(tag, ...args) {
    if (!shouldLog("error")) return;
    console.error(format(tag, colors.red), ...args);
  },
};

module.exports = logger;
