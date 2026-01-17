import express from "express";
import router from "./routes";
/*__IMPORTS__*/

const app = express();

// Parse JSON request bodies
app.use(express.json());

/*__MIDDLEWARE__*/

// Connect routes
app.use(router);

export default app;