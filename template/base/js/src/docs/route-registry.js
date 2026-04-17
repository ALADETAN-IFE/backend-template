class RouteRegistry {
  constructor() {
    this.routes = [];
  }

  register(route) {
    this.routes.push(route);
  }

  getRoutes() {
    return this.routes;
  }

  generateOpenAPI(projectName, version = "1.0.0") {
    const paths = {};
    const tags = new Set();

    // Collect all unique tags
    this.routes.forEach((route) => {
      route.docs.tags?.forEach((tag) => tags.add(tag));
    });

    // Build paths from routes
    this.routes.forEach((route) => {
      if (!paths[route.path]) {
        paths[route.path] = {};
      }

      const pathItem = paths[route.path];
      const method = route.method.toLowerCase();

      pathItem[method] = {
        tags: route.docs.tags || [],
        summary: route.docs.summary,
        description: route.docs.description,
        parameters: route.docs.parameters || [],
        requestBody: route.docs.requestBody,
        responses: route.docs.responses,
      };
    });

    return {
      openapi: "3.0.3",
      info: {
        title: `${projectName} API`,
        version,
        description: "Auto-generated from route schemas.",
      },
      servers: [{ url: "http://localhost:4000" }],
      tags: Array.from(tags).map((tag) => ({
        name: tag,
        description: `${tag} endpoints`,
      })),
      paths,
    };
  }
}

const routeRegistry = new RouteRegistry();

module.exports = {
  routeRegistry,
};
