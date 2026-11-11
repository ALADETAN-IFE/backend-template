// scripts/warn-install.js

import pc from "picocolors";

const npmGlobal = process.env.npm_config_global === "true";
const yarnGlobal = process.env.npm_config_is_global === "true";

// Local installs run inside a project's node_modules folder
const isInstalledInNodeModules = process.cwd().includes("node_modules");
const isLocalInstall = isInstalledInNodeModules && !npmGlobal && !yarnGlobal;

if (isLocalInstall) {
  console.log(pc.red("\n---------------------------------------------------------"));
  console.log(pc.bold(pc.red("⚠️  INCORRECT INSTALLATION METHOD")));
  console.log(
    "You installed @ifecodes/backend-template as a local dependency."
  );
  console.log(
    "This is a project generator and should NOT be added to node_modules."
  );
  console.log(pc.yellow("\nHow to use this package correctly:"));
  console.log(
    pc.green("  1. Run without installing:  npx @ifecodes/backend-template")
  );
  console.log(
    pc.green("  2. Or install globally:      npm i -g @ifecodes/backend-template")
  );
  console.log("\nTo clean up your current project, run:");
  console.log(pc.cyan("  npm uninstall @ifecodes/backend-template"));
  console.log(pc.red("---------------------------------------------------------\n"));
}
