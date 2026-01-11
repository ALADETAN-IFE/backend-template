import http from "http";
import app from "./app";
import { logger } from "@/utils";
import { ENV } from "@/config";

const PORT = ENV.PORT || 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
  });
});
