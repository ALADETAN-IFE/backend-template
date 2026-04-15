const express = require("express");
const router = require("./routes");
const { errorHandler } = require("./middlewares");
/*__IMPORTS__*/

const app = express();

// Parse JSON request bodies
app.use(express.json());

/*__MIDDLEWARE__*/

// Connect routes
app.use(router);

app.use(errorHandler);

module.exports = app;
