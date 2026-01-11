import mongoose from "mongoose";
import { ENV } from "./env";
import { logger } from "@/utils";

export const connectDB = async () => {
  await mongoose.connect(ENV.MONGO_URI);
  logger.log("db", "MongoDB connected");
};
