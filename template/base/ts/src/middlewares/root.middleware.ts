import { Request, Response } from "express";

export const rootHandler = (_req: Request, res: Response) => {
  res.json({
    name: "/*__PROJECT_NAME__*/",
    type: "/*__PROJECT_TYPE__*/",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/v1/health",
      /*__AUTH_ENDPOINT__*/
    },
  });
};
