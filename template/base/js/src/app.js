const express = require("express");
const router = require("./routes");
/*__IMPORTS__*/

const app = express();

// Parse JSON request bodies
app.use(express.json());

/*__MIDDLEWARE__*/

// Connect routes
app.use(router);

module.exports = app;
