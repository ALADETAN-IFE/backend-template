/**
 * Centralized catalog of compatible, tested dependency versions.
 * This ensures consistency across template generations, whether installing
 * immediately or generating files with skipInstall.
 */

export const DEPENDENCY_VERSIONS = {
  // Runtime Dependencies
  dotenv: "^16.4.7",
  express: "^5.2.1",
  "module-alias": "^2.2.3",
  "swagger-ui-express": "^5.0.1",
  cors: "^2.8.5",
  helmet: "^8.0.0",
  morgan: "^1.10.0",
  "express-rate-limit": "^7.4.1",
  zod: "^3.23.8",
  jsonwebtoken: "^9.0.2",
  mongoose: "^8.8.0",
  argon2: "^0.41.1",
  bcrypt: "^5.1.1",
  "http-proxy-middleware": "^3.0.3",
  pm2: "^6.0.14",
  "ts-node": "^10.9.2",

  // Dev Dependencies
  typescript: "^5.7.2",
  "ts-node-dev": "^2.0.0",
  "tsconfig-paths": "^4.2.0",
  nodemon: "^3.1.7",
  prettier: "^3.4.2",
  eslint: "^9.15.0",
  "eslint-config-prettier": "^10.1.8",
  husky: "^9.1.7",
  "@types/node": "^22.10.1",
  "@types/express": "^5.0.0",
  "@types/cors": "^2.8.17",
  "@types/morgan": "^1.9.9",
  "@types/swagger-ui-express": "^4.1.7",
  "@types/jsonwebtoken": "^9.0.7",
  "@types/bcrypt": "^5.0.2",
  "@types/http-proxy-middleware": "^3.0.0",
  "@typescript-eslint/eslint-plugin": "^8.16.0",
  "@typescript-eslint/parser": "^8.16.0",
};

/**
 * Resolves a list of dependency names into an object mapping package name to version string.
 * If baseDeps are provided, existing versions are preserved unless explicitly overridden.
 *
 * @param {string[]} pkgNames - Array of package names to resolve
 * @param {Record<string, string>} [baseDeps={}] - Existing dependencies to merge with
 * @returns {Record<string, string>}
 */
export function resolveDependencyVersions(pkgNames = [], baseDeps = {}) {
  const resolved = { ...baseDeps };

  for (const name of pkgNames) {
    if (!name) continue;
    if (!resolved[name]) {
      resolved[name] = DEPENDENCY_VERSIONS[name] || "latest";
    }
  }

  // Sort keys alphabetically for clean, deterministic package.json files
  const sorted = {};
  for (const key of Object.keys(resolved).sort()) {
    sorted[key] = resolved[key];
  }

  return sorted;
}
