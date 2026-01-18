export const deps = ["helmet"];
export const getImports = (language) => language === "javascript"
  ? `const helmet = require("helmet");`
  : `import helmet from "helmet";`;
export const imports = getImports("typescript");
export const middleware = `app.use(helmet());`;
