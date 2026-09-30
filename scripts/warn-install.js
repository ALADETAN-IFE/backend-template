// scripts/warn-install.js

const npmGlobal = process.env.npm_config_global === "true";
const yarnGlobal = process.env.npm_config_is_global === "true";

// Local installs run inside a project's node_modules folder
const isInstalledInNodeModules = process.cwd().includes("node_modules");
const isLocalInstall = isInstalledInNodeModules && !npmGlobal && !yarnGlobal;

if (isLocalInstall) {
  console.log(
    "\n\x1b[31m%s\x1b[0m",
    "---------------------------------------------------------"
  );
  console.log("\x1b[1m\x1b[31m%s\x1b[0m", "⚠️  INCORRECT INSTALLATION METHOD");
  console.log(
    "You installed @ifecodes/backend-template as a local dependency."
  );
  console.log(
    "This is a project generator and should NOT be added to node_modules."
  );
  console.log("\n\x1b[33m%s\x1b[0m", "How to use this package correctly:");
  console.log(
    "\x1b[32m%s\x1b[0m",
    "  1. Run without installing:  npx @ifecodes/backend-template"
  );
  console.log(
    "\x1b[32m%s\x1b[0m",
    "  2. Or install globally:      npm i -g @ifecodes/backend-template"
  );
  console.log("\nTo clean up your current project, run:");
  console.log(
    "\x1b[36m%s\x1b[0m",
    "  npm uninstall @ifecodes/backend-template"
  );
  console.log(
    "\x1b[31m%s\x1b[0m",
    "---------------------------------------------------------\n"
  );
}
