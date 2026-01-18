export const deps = ["cors"];
export const devDeps = ["@types/cors"];
export const getImports = (language) => language === "javascript" 
  ? `const cors = require("cors");\nconst { ENV } = require("./config");`
  : `import cors from "cors";\nimport { ENV } from "@/config";`;
export const imports = getImports("typescript");
export const middleware = `
const corsOptions = {
  origin: ENV.ALLOWED_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));`;
