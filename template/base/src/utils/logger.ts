import { ENV } from "@/config";

function format(tag: string, args: unknown[]) {
  return [`%c[${tag}]`, "color:#6366f1;font-weight:600", ...args];
}

const environment =
  ENV.NODE_ENV === "development" || ENV.NODE_ENV === "staging"
    ? "development"
    : ENV.NODE_ENV;

const logger = {
  log(tag: string, ...args: unknown[]) {
    if (environment !== "development") return;
    console.log(...format(tag, args));
  },

  info(tag: string, ...args: unknown[]) {
    if (environment !== "development") return;
    console.info(...format(tag, args));
  },

  warn(tag: string, ...args: unknown[]) {
    if (environment !== "development") return;
    console.warn(...format(tag, args));
  },

  error(tag: string, ...args: unknown[]) {
    if (environment !== "development") return;
    console.error(...format(tag, args));
  },
};

export default logger;
