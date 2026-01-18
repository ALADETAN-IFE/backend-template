const app = require("./app");
const { ENV/*__DB_IMPORT__*/ } = require("./config");
const { logger } = require("./utils");

const PORT = ENV.PORT || 3000;

const startServer = async () => {
  /*__DB_CONNECT__*/

  app.listen(PORT, () => {
    logger.info("Server", `Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  logger.error("Server", "Failed to start server", error);
  process.exit(1);
});
