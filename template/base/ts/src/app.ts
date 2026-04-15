import express from "express";
import router from "./routes";
import { errorHandler } from "@/middlewares";
/*__IMPORTS__*/

const app = express();

// Parse JSON request bodies
app.use(express.json());

/*__MIDDLEWARE__*/

// Connect routes
app.use(router);

app.use(errorHandler);

export default app;