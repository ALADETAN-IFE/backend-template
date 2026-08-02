const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  // Files/paths to ignore (replaces .eslintignore usage in flat config)
  {
    ignores: ["node_modules/**", "dist/**"],
  },

  // TypeScript rules for source files
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Disallow explicit `any`
      "@typescript-eslint/no-explicit-any": "error",

      // You can add or tune more TypeScript rules here
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
];
