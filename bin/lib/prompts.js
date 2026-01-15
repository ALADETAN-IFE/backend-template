import prompts from "prompts";
import pc from "picocolors";
import fs from "fs";
import path from "path";

export const getProjectConfig = async () => {
  // Check if running in CI or non-interactive mode
  const isCI = process.env.CI === 'true' || !process.stdin.isTTY;
  
  // Check if we're in an existing microservice project
  const isInMicroserviceProject = fs.existsSync(
    path.join(process.cwd(), "services")
  );

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Separate project name parts from project type
  // Look for "microservice", "monolith", "micro", or "mono" in args
  let cliName = null;
  let cliProjectType = null;
  
  const projectTypeKeywords = ["microservice", "monolith", "micro", "mono"];
  const projectTypeIndex = args.findIndex(arg => 
    projectTypeKeywords.includes(arg.toLowerCase())
  );
  
  if (projectTypeIndex !== -1) {
    // Everything before the type keyword is the project name
    cliName = args.slice(0, projectTypeIndex).join("-");
    const typeArg = args[projectTypeIndex].toLowerCase();
    cliProjectType = typeArg === "micro" || typeArg === "microservice" 
      ? "microservice" 
      : "monolith";
  } else if (args.length > 0) {
    // If no type keyword found, treat all args as project name
    cliName = args.join("-");
  }

  // Pre-fill values from CLI args if provided
  const hasCliArgs = cliName && !isInMicroserviceProject;

  const res = await prompts(
    [
    {
      type: isInMicroserviceProject || hasCliArgs || isCI ? null : "text",
      name: "name",
      message: pc.cyan("Project name"),
      initial: "my-backend",
    },
    {
      type: isInMicroserviceProject || isCI ? null : "select",
      name: "language",
      message: pc.cyan("Select language"),
      choices: [
        { title: pc.green("TypeScript"), value: "typescript" },
        { title: pc.yellow("JavaScript"), value: "javascript" },
      ],
      initial: 0,
    },
    {
      type: isInMicroserviceProject || isCI ? null : "text",
      name: "description",
      message: pc.cyan("Project description") + pc.dim(" (optional)"),
      initial: "",
    },
    {
      type: isInMicroserviceProject || isCI ? null : "text",
      name: "author",
      message: pc.cyan("Author") + pc.dim(" (optional)"),
      initial: "",
    },
    {
      type: isInMicroserviceProject || isCI ? null : "text",
      name: "keywords",
      message: pc.cyan("Keywords") + pc.dim(" (comma-separated, optional)"),
      initial: "",
    },
    {
      type: isInMicroserviceProject || (hasCliArgs && cliProjectType) || isCI ? null : "select",
      name: "projectType",
      message: pc.cyan("Project type"),
      choices: [
        { title: pc.blue("Monolith API"), value: "monolith" },
        { title: pc.magenta("Microservice"), value: "microservice" },
      ],
    },
    {
      type: (prev, values) =>
        isInMicroserviceProject || isCI
          ? null
          : prev === "microservice"
          ? "select"
          : null,
      name: "mode",
      message: pc.cyan("Microservice setup"),
      choices: [
        { title: pc.blue("With Docker 🐳"), value: "docker" },
        { title: pc.yellow("Without Docker (PM2)"), value: "nodocker" },
      ],
    },
    {
      type: isInMicroserviceProject ? "text" : isCI ? null : "multiselect",
      name: isInMicroserviceProject ? "serviceName" : "features",
      message: isInMicroserviceProject
        ? pc.cyan("New service name") + pc.dim(" (e.g., user-service, order-service)")
        : pc.cyan("Select features"),
      choices: isInMicroserviceProject
        ? undefined
        : [
            { title: pc.blue("CORS"), value: "cors" },
            { title: pc.yellow("Rate Limiter"), value: "rate-limit" },
            { title: pc.green("Helmet"), value: "helmet" },
            { title: pc.magenta("Morgan (HTTP logger)"), value: "morgan" },
          ],
    },
    {
      type: isCI ? null : "toggle",
      name: "auth",
      message: isInMicroserviceProject
        ? pc.cyan("Include authentication in this service?")
        : pc.cyan("Include authentication system?"),
      initial: true,
      active: pc.green("yes"),
      inactive: pc.red("no"),
    },
    {
      type: isInMicroserviceProject && !isCI ? "multiselect" : null,
      name: "features",
      message: pc.cyan("Select features for this service"),
      choices: [
        { title: pc.yellow("Rate Limiter"), value: "rate-limit" },
        { title: pc.green("Helmet"), value: "helmet" },
        { title: pc.magenta("Morgan (HTTP logger)"), value: "morgan" },
        { title: pc.blue("CORS"), value: "cors" },
      ],
    },
  ],
  {
    onCancel: () => {
      console.log(pc.yellow("\n❌ Operation cancelled by user."));
      process.exit(0);
    }
  });

  // Handle cancelled prompts (user pressed Ctrl+C or closed the prompt)
  // Check if user cancelled the prompt (Ctrl+C) vs just didn't enter anything
  if (!res) {
    console.log(pc.yellow("\n❌ Operation cancelled by user."));
    process.exit(0);
  }
  
  // Check if critical fields are missing (indicates cancellation mid-prompt)
  if (!isInMicroserviceProject && !isCI) {
    // For new projects, we need language and projectType
    if (!res.language || (!res.projectType && !cliProjectType)) {
      console.log(pc.yellow("\n❌ Operation cancelled by user."));
      process.exit(0);
    }
  }
  
  // If the response is empty but we expected prompts, something went wrong
  if (Object.keys(res).length === 0 && !isInMicroserviceProject && !hasCliArgs && !isCI) {
    console.log(pc.red("\n❌ No inputs received. Please try again."));
    process.exit(1);
  }

  // Set defaults for CI/non-interactive mode
  if (isCI) {
    res.features = res.features || [];
    res.auth = res.auth ?? false;
    res.mode = res.mode || "docker"; // Default to docker in CI
    res.language = res.language || "typescript"; // Default to TypeScript in CI
  }

  // Merge CLI args with prompted responses
  if (hasCliArgs) {
    res.name = cliName;
    if (cliProjectType) {
      res.projectType = cliProjectType;
    } else {
      // If no project type in CLI, default to monolith
      res.projectType = res.projectType || "monolith";
    }
  }
  
  // Ensure we have a project name (fallback if somehow missed)
  if (!res.name && !isInMicroserviceProject) {
    res.name = "my-backend";
  }

  let sanitizedName, target, isExistingProject, mode;

  if (isInMicroserviceProject) {
    // We're adding to an existing project
    target = process.cwd();
    sanitizedName = path.basename(target);
    isExistingProject = true;

    // Detect mode from existing files
    mode = fs.existsSync(path.join(target, "docker-compose.yml"))
      ? "docker"
      : "nodocker";

    console.log(pc.cyan(`\n📁 Detected existing microservice project: ${sanitizedName}`));
    console.log(pc.dim(`Mode: ${mode}\n`));
  } else {
    sanitizedName = res.name.replace(/\s+/g, "-");
    target = path.resolve(process.cwd(), sanitizedName);
    isExistingProject = fs.existsSync(target);
    mode = res.mode;
  }

  return {
    ...res,
    sanitizedName,
    target,
    isExistingProject,
    mode,
    isInMicroserviceProject,
  };
};
