export const deps = ["cors", "@types/cors"];
export const imports = `import cors from "cors";`;
export const middleware = `
const corsOptions = {
  origin: ENV.ALLOWED_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));`;
