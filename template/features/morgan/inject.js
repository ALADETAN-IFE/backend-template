export const deps = ["morgan"];
export const devDeps = ["@types/morgan"];
export const imports = `import morgan from "morgan";`;
export const middleware = `app.use(morgan("dev"));`;
