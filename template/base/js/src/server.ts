import app from "./app";
import { ENV } from "./config";
import { logger } from "@/utils";
/*__DB_IMPORT__*/

const PORT = ENV.PORT || 3000;

const startServer = async () => {
  /*__DB_CONNECT__*/

  app.listen(PORT, () => {
    logger.info("Server", `Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  logger.error("Server", "Failed to start server", error as Error);
  process.exit(1);
});
