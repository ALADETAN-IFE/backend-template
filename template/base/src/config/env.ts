import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT!,
  /*__ALLOWED_ORIGIN__*/
  NODE_ENV: process.env.NODE_ENV!,
  /*__MONGO_URI__*/
  /*__JWT_SECRET__*/
};
