export const gatewayDeps = ["http-proxy-middleware"];

export const generateGatewayRoutes = (services) => {
  const routes = services
    .filter(s => s !== "gateway")
    .map((service, index) => {
      const port = 4001 + index; // Gateway is 4000, services start at 4001
      const routePath = service.replace("-service", "");
      
      return `
// Route ${service} to port ${port}
app.use("/${routePath}", createProxyMiddleware({
  target: "http://localhost:${port}",
  changeOrigin: true,
  pathRewrite: {
    "^/${routePath}": "",
  },
  onError: (err, req, res) => {
    logger.error(\`Proxy error for ${service}:\`, err);
    res.status(503).json({ error: "Service unavailable" });
  },
}));`;
    })
    .join("\n");

  return routes;
};
