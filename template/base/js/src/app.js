const express = require("express");
const router = require("./routes");
const { errorHandler, observabilityMiddleware } = require("./middlewares");
/*__IMPORTS__*/

const app = express();

// Parse JSON request bodies
app.use(express.json());

app.use(observabilityMiddleware);

/*__MIDDLEWARE__*/

// Connect routes
app.use(router);

app.use(errorHandler);

module.exports = app;
