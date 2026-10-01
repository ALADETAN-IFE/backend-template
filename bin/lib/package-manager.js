import { execSync } from "child_process";
import pc from "picocolors";
import prompts from "prompts";

export function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("yarn")) return "yarn";
  if (userAgent.startsWith("bun")) return "bun";
  return "npm";
}

export function isPackageManagerInstalled(pm) {
  if (pm === "npm") return true;
  try {
    execSync(`${pm} --version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function getPackageManagerCommands(pm = "npm") {
  switch (pm) {
    case "pnpm":
      return {
        name: "pnpm",
        install: "pnpm install",
        add: (pkgs) => `pnpm add ${pkgs.join(" ")}`,
        addDev: (pkgs) => `pnpm add -D ${pkgs.join(" ")}`,
        run: (script) => `pnpm run ${script}`,
        exec: (cmd) => `pnpm dlx ${cmd}`,
        prepare: "pnpm run prepare",
        format: "pnpm run format",
        dev: "pnpm dev",
      };
    case "yarn":
      return {
        name: "yarn",
        install: "yarn install",
        add: (pkgs) => `yarn add ${pkgs.join(" ")}`,
        addDev: (pkgs) => `yarn add -D ${pkgs.join(" ")}`,
        run: (script) => `yarn ${script}`,
        exec: (cmd) => `yarn dlx ${cmd}`,
        prepare: "yarn run prepare",
        format: "yarn run format",
        dev: "yarn dev",
      };
    case "bun":
      return {
        name: "bun",
        install: "bun install",
        add: (pkgs) => `bun add ${pkgs.join(" ")}`,
        addDev: (pkgs) => `bun add -d ${pkgs.join(" ")}`,
        run: (script) => `bun run ${script}`,
        exec: (cmd) => `bunx ${cmd}`,
        prepare: "bun run prepare",
        format: "bun run format",
        dev: "bun run dev",
      };
    case "npm":
    default:
      return {
        name: "npm",
        install: "npm install",
        add: (pkgs) => `npm install ${pkgs.join(" ")}`,
        addDev: (pkgs) => `npm install -D ${pkgs.join(" ")}`,
        run: (script) => `npm run ${script}`,
        exec: (cmd) => `npx ${cmd}`,
        prepare: "npm run prepare",
        format: "npm run format",
        dev: "npm run dev",
      };
  }
}

export async function ensurePackageManager(chosenPm = "npm") {
  if (chosenPm === "npm" || isPackageManagerInstalled(chosenPm)) {
    return { pm: chosenPm, skipInstall: false };
  }

  console.log(
    pc.yellow(`\n⚠️  '${chosenPm}' is not installed or not found in your PATH.`)
  );

  const choices = [
    {
      title: `${pc.green("Fall back to npm")} ${pc.dim(
        "(Recommended - install dependencies with npm)"
      )}`,
      value: "fallback",
    },
    {
      title: `${pc.yellow("Skip installation")} ${pc.dim(
        `(Generate files only, I'll install ${chosenPm} and dependencies later)`
      )}`,
      value: "skip",
    },
  ];

  if (chosenPm === "pnpm" || chosenPm === "yarn") {
    choices.push({
      title: `${pc.cyan(`Enable ${chosenPm} now`)} ${pc.dim(
        "(via corepack enable)"
      )}`,
      value: "install_now",
    });
  } else if (chosenPm === "bun") {
    choices.push({
      title: `${pc.cyan("Install bun globally now")} ${pc.dim(
        "(via npm i -g bun)"
      )}`,
      value: "install_now",
    });
  }

  const response = await prompts({
    type: "select",
    name: "action",
    message: pc.cyan(
      `How would you like to proceed since '${chosenPm}' is missing?`
    ),
    choices,
    initial: 0,
  });

  if (!response.action || response.action === "fallback") {
    console.log(
      pc.cyan(
        `\n🔄 Proceeding with ${pc.bold("npm")} for dependency installation...\n`
      )
    );
    return { pm: "npm", preferredPm: chosenPm, skipInstall: false };
  }

  if (response.action === "skip") {
    console.log(
      pc.yellow(
        `\n⏭️  Skipping dependency installation. Project will be configured for ${chosenPm}.\n`
      )
    );
    return { pm: chosenPm, preferredPm: chosenPm, skipInstall: true };
  }

  if (response.action === "install_now") {
    console.log(pc.cyan(`\n⏳ Attempting to enable/install ${chosenPm}...`));
    try {
      if (chosenPm === "pnpm" || chosenPm === "yarn") {
        try {
          execSync("corepack enable", { stdio: "inherit" });
        } catch {
          execSync(`npm install -g ${chosenPm}`, { stdio: "inherit" });
        }
      } else {
        execSync(`npm install -g ${chosenPm}`, { stdio: "inherit" });
      }

      if (isPackageManagerInstalled(chosenPm)) {
        console.log(pc.green(`\n✅ ${chosenPm} installed and ready!\n`));
        return { pm: chosenPm, preferredPm: chosenPm, skipInstall: false };
      }
    } catch (err) {
      console.warn(
        pc.yellow(`\n⚠️  Could not automatically install ${chosenPm}.`)
      );
    }
    console.log(pc.cyan(`🔄 Falling back to npm for installation...\n`));
    return { pm: "npm", preferredPm: chosenPm, skipInstall: false };
  }

  return { pm: "npm", preferredPm: chosenPm, skipInstall: false };
}
