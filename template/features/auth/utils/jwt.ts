import jwt from "jsonwebtoken";
import { ENV } from "@/config";

// JwtPayload mirrors the global JwtPayload declared in `src/types/express.d.ts`.
export type JwtPayload = {
  email?: string;
  iat?: number;
  exp?: number;
};

export const generateToken = (payload: JwtPayload) =>
  jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
