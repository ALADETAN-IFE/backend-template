export const deps = ["express-rate-limit"];
export const getImports = (language) => language === "javascript"
  ? `const rateLimit = require("express-rate-limit");`
  : `import rateLimit from "express-rate-limit";`;
export const imports = getImports("typescript");
export const middleware = `app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));`;
