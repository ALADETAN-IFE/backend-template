import prompts from "prompts";
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
      message: "Project name",
      initial: "my-backend",
    },
    {
      type: isInMicroserviceProject || hasCliArgs || isCI ? null : "text",
      name: "description",
      message: "Project description (optional)",
      initial: "",
    },
    {
      type: isInMicroserviceProject || hasCliArgs || isCI ? null : "text",
      name: "author",
      message: "Author (optional)",
      initial: "",
    },
    {
      type: isInMicroserviceProject || hasCliArgs || isCI ? null : "text",
      name: "keywords",
      message: "Keywords (comma-separated, optional)",
      initial: "",
    },
    {
      type: isInMicroserviceProject || (hasCliArgs && cliProjectType) || isCI ? null : "select",
      name: "projectType",
      message: "Project type",
      choices: [
        { title: "Monolith API", value: "monolith" },
        { title: "Microservice", value: "microservice" },
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
      message: "Microservice setup",
      choices: [
        { title: "With Docker", value: "docker" },
        { title: "Without Docker", value: "nodocker" },
      ],
    },
    {
      type: isInMicroserviceProject ? "text" : isCI ? null : "multiselect",
      name: isInMicroserviceProject ? "serviceName" : "features",
      message: isInMicroserviceProject
        ? "New service name (e.g., user-service, order-service)"
        : "Select features",
      choices: isInMicroserviceProject
        ? undefined
        : [
            { title: "CORS", value: "cors" },
            { title: "Rate Limiter", value: "rate-limit" },
            { title: "Helmet", value: "helmet" },
            { title: "Morgan (HTTP logger)", value: "morgan" },
          ],
    },
    {
      type: isCI ? null : "toggle",
      name: "auth",
      message: isInMicroserviceProject
        ? "Include authentication in this service?"
        : "Include authentication system?",
      initial: true,
      active: "yes",
      inactive: "no",
    },
    {
      type: isInMicroserviceProject && !isCI ? "multiselect" : null,
      name: "features",
      message: "Select features for this service",
      choices: [
        { title: "Rate Limiter", value: "rate-limit" },
        { title: "Helmet", value: "helmet" },
        { title: "Morgan (HTTP logger)", value: "morgan" },
        { title: "CORS", value: "cors" },
      ],
    },
  ]);

  // Set defaults for CI/non-interactive mode
  if (isCI) {
    res.features = res.features || [];
    res.auth = res.auth ?? false;
    res.mode = res.mode || "docker"; // Default to docker in CI
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

    console.log(`\n📁 Detected existing microservice project: ${sanitizedName}`);
    console.log(`Mode: ${mode}\n`);
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
