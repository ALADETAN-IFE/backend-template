import { Request, Response, NextFunction } from "express";
import { loginService, registerService } from "./auth.service";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await loginService(req.body);
    return res.status(200).json({ token });
  } catch (err) {
    return next(err);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await registerService(req.body);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
};
