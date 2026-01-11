import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const generateDockerCompose = (target, allServices) => {
  const dockerCompose = {
    version: "3.8",
    services: {},
  };

  for (const serviceName of allServices) {
    // Gateway runs on 4000, other services start from 4001
    const isGateway = serviceName === "gateway";
    const serviceIndex = allServices.indexOf(serviceName);
    const port = isGateway ? 4000 : 4001 + allServices.filter((s, i) => s !== "gateway" && i < serviceIndex).length;
    
    dockerCompose.services[serviceName] = {
      build: `./services/${serviceName}`,
      ports: [
        `\${${serviceName
          .toUpperCase()
          .replace(/-/g, "_")}_PORT:-${port}}:${isGateway ? 4000 : 4000}`,
      ],
      environment: [`NODE_ENV=\${NODE_ENV:-development}`],
      volumes: [`./services/${serviceName}:/app`, `/app/node_modules`],
    };
  }

  fs.writeFileSync(
    path.join(target, "docker-compose.yml"),
    `version: "${dockerCompose.version}"\nservices:\n` +
      Object.entries(dockerCompose.services)
        .map(
          ([name, config]) =>
            `  ${name}:\n` +
            `    build: ${config.build}\n` +
            `    ports:\n      - "${config.ports[0]}"\n` +
            `    environment:\n      - ${config.environment[0]}\n` +
            `    volumes:\n` +
            config.volumes.map((v) => `      - ${v}`).join("\n")
        )
        .join("\n")
  );
};

export const generatePm2Config = (target, allServices) => {
  const pm2Config = {
    apps: allServices.map((serviceName, index) => {
      const isGateway = serviceName === "gateway";
      const port = isGateway ? 4000 : 4001 + allServices.filter((s, i) => s !== "gateway" && i < index).length;
      
      return {
        name: serviceName,
        script: `./services/${serviceName}/src/server.ts`,
        instances: 1,
        exec_mode: "fork",
        env: {
          PORT: port
        }
      };
    }),
  };

  fs.writeFileSync(
    path.join(target, "pm2.config.js"),
    `module.exports = ${JSON.stringify(pm2Config, null, 2)};\n`
  );
};

export const copyDockerfile = (target, servicesToCreate) => {
  const dockerfilePath = path.join(
    __dirname,
    "../../template/microservice/docker/Dockerfile"
  );
  
  for (const serviceName of servicesToCreate) {
    const serviceDockerfile = path.join(
      target,
      "services",
      serviceName,
      "Dockerfile"
    );
    if (!fs.existsSync(serviceDockerfile)) {
      fs.copyFileSync(dockerfilePath, serviceDockerfile);
    }
  }
};
