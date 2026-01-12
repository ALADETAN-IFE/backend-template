export const deps = ["cors"];
export const devDeps = ["@types/cors"];
export const imports = `import cors from "cors";\nimport { ENV } from "@/config";`;
export const middleware = `
const corsOptions = {
  origin: ENV.ALLOWED_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));`;
