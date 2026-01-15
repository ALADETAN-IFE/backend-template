import { ENV } from "@/config";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

function format(tag: string, color: string) {
  return `${color}${colors.bold}[${tag}]${colors.reset}`;
}

function getEnvironment() {
  return ENV.NODE_ENV === "development" || ENV.NODE_ENV === "staging"
    ? "development"
    : ENV.NODE_ENV;
}

const logger = {
  log(tag: string, ...args: unknown[]) {
    if (getEnvironment() !== "development") return;
    console.log(format(tag, colors.blue), ...args);
  },

  info(tag: string, ...args: unknown[]) {
    if (getEnvironment() !== "development") return;
    console.info(format(tag, colors.cyan), ...args);
  },

  warn(tag: string, ...args: unknown[]) {
    if (getEnvironment() !== "development") return;
    console.warn(format(tag, colors.yellow), ...args);
  },

  error(tag: string, ...args: unknown[]) {
    if (getEnvironment() !== "development") return;
    console.error(format(tag, colors.red), ...args);
  },
};

export default logger;
