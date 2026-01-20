export const gatewayDeps = ["http-proxy-middleware"];

export const generateGatewayRoutes = (services, mode = "docker") => {
  const routes = services
    .filter((s) => s !== "gateway")
    .map((service, index) => {
      const servicePort = `${service.toUpperCase().replace(/-/g, "_")}_PORT`;
      const port = 4001 + index; // Host port mapping: gateway=4000, services start at 4001

      // Docker: use container name with internal port 4000
      // Non-docker: use localhost with mapped host port
      const host = mode === "docker" ? service : "localhost";
      const servicePortEnv = `${servicePort}`

      return `
// Proxy to ${service}
const ${servicePort} = ENV.${servicePort} || ${port}
app.use("/api", createProxyMiddleware({
  target: \`http://${host}:${servicePortEnv}/api\`,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      logger.error(\`Proxy error for ${service}:\`, err);
      (res as Response).status(503).json({ error: "Service unavailable" });
    },
  },
}));`;
    })
    .join("\n");

  return routes;
};
