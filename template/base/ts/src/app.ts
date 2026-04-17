import express from "express";
import router from "./routes";
import { errorHandler, observabilityMiddleware } from "@/middlewares";
/*__IMPORTS__*/

const app = express();

// Parse JSON request bodies
app.use(express.json());

app.use(observabilityMiddleware);

/*__MIDDLEWARE__*/

// Connect routes
app.use(router);

app.use(errorHandler);

export default app;