export const deps = ["morgan", "@types/morgan"];
export const imports = `import morgan from "morgan";`;
export const middleware = `app.use(morgan("dev"));`;
