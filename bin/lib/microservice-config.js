import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const generateDockerCompose = (target, allServices) => {
  const dockerCompose = {
    services: {},
  };

  // Build environment variables map for all services
  const allServicePorts = allServices.map((service, index) => {
    const isGateway = service === "gateway";
    const port = isGateway ? 4000 : 4001 + allServices.filter((s, i) => s !== "gateway" && i < index).length;
    const envVarName = `${service.toUpperCase().replace(/-/g, "_")}_PORT`;
    return { service, port, envVarName };
  });

  for (const serviceName of allServices) {
    // Gateway runs on 4000, other services start from 4001
    const serviceInfo = allServicePorts.find(s => s.service === serviceName);
    const port = serviceInfo.port;
    const envVarName = serviceInfo.envVarName;
    
    // Build environment variables array - include all service ports
    const environmentVars = [
      `NODE_ENV=\${NODE_ENV:-development}`,
      ...allServicePorts.map(s => `${s.envVarName}=\${${s.envVarName}:-${s.port}}`)
    ];
    
    dockerCompose.services[serviceName] = {
      build: {
        context: `./services/${serviceName}`,
        dockerfile: "Dockerfile"
      },
      image: `${serviceName}:latest`,
      container_name: serviceName,
      ports: [
        `\${${envVarName}:-${port}}:\${${envVarName}:-${port}}`,
      ],
      environment: environmentVars,
      volumes: [
        `./services/${serviceName}:/app`,
        `./shared:/app/shared`,
        `/app/node_modules`
      ],
    };
  }

  fs.writeFileSync(
    path.join(target, "docker-compose.yml"),
    `services:\n` +
      Object.entries(dockerCompose.services)
        .map(
          ([name, config]) =>
            `  ${name}:\n` +
            `    build:\n` +
            `      context: ${config.build.context}\n` +
            `      dockerfile: ${config.build.dockerfile}\n` +
            `    image: ${config.image}\n` +
            `    container_name: ${config.container_name}\n` +
            `    ports:\n      - "${config.ports[0]}"\n` +
            `    environment:\n` +
            config.environment.map((e) => `      - ${e}`).join("\n") + "\n" +
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

export const copyDockerignore = (target, servicesToCreate) => {
  const dockerignorePath = path.join(
    __dirname,
    "../../template/microservice/docker/.dockerignore"
  );
  
  for (const serviceName of servicesToCreate) {
    const serviceDockerignore = path.join(
      target,
      "services",
      serviceName,
      ".dockerignore"
    );
    if (!fs.existsSync(serviceDockerignore)) {
      fs.copyFileSync(dockerignorePath, serviceDockerignore);
    }
  }
};
