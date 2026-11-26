import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const warnScriptPath = path.join(__dirname, "warn-install.js");

const tempRoot = mkdtempSync(path.join(tmpdir(), "warn-install-check-"));
const installPath = path.join(tempRoot, "node_modules");
mkdirSync(installPath, { recursive: true });

const result = spawnSync(process.execPath, [warnScriptPath], {
  cwd: installPath,
  env: {
    ...process.env,
    npm_config_global: "false",
    npm_config_is_global: "false",
  },
  encoding: "utf8",
});

rmSync(tempRoot, { recursive: true, force: true });

if (result.error) {
  console.error("Failed to run warn-install.js:", result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error("warn-install.js exited with non-zero status.");
  if (result.stderr) {
    console.error(result.stderr);
  }
  process.exit(result.status ?? 1);
}

const output = (result.stdout || "").replace(/\x1B\[[0-9;]*m/g, "");
const requiredSnippets = [
  "INCORRECT INSTALLATION METHOD",
  "You installed @ifecodes/backend-template as a local dependency.",
  "npx @ifecodes/backend-template",
  "npm i -g @ifecodes/backend-template",
];

const missing = requiredSnippets.filter((snippet) => !output.includes(snippet));

if (missing.length > 0) {
  console.error("warn-install.js output missing expected content:");
  for (const snippet of missing) {
    console.error(`- ${snippet}`);
  }
  console.error("\nActual output:\n", output);
  process.exit(1);
}

console.log("warn-install.js output check passed.");
