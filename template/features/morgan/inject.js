export const deps = ["morgan"];
export const devDeps = ["@types/morgan"];
export const getImports = (language) => language === "javascript"
  ? `const morgan = require("morgan");`
  : `import morgan from "morgan";`;
export const imports = getImports("typescript");
export const middleware = `app.use(morgan("dev"));`;
