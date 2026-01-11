export const deps = ["express-rate-limit"];
export const imports = `import rateLimit from "express-rate-limit";`;
export const middleware = `app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));`;
