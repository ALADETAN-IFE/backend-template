const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "/*__PROJECT_NAME__*/ API",
    version: "1.0.0",
    description: "Auto-generated API documentation for the backend template project.",
  },
  servers: [{ url: "http://localhost:4000" }],
  tags: [{ name: "Health", description: "Health and status endpoints" }],
  paths: {
    "/": {
      get: {
        summary: "Root endpoint",
        description: "Returns service metadata and key endpoints.",
        responses: {
          "200": {
            description: "Service metadata",
          },
        },
      },
    },
    "/api/v1/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Returns API health and runtime metrics. If auth is enabled, includes MongoDB connection status.",
        parameters: [
          {
            name: "verbose",
            in: "query",
            required: false,
            schema: { type: "boolean" },
            description: "Optional verbose mode for richer diagnostics.",
          },
        ],
        responses: {
          "200": {
            description: "Healthy response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["healthy", "unhealthy"] },
                    uptime: { type: "number" },
                    timestamp: { type: "string" },
                    services: {
                      type: "object",
                      properties: {
                        mongodb: { type: "string", enum: ["connected", "disconnected"] },
                        memory: {
                          type: "object",
                          properties: {
                            rss: { type: "number" },
                            heapUsed: { type: "number" },
                          },
                        },
                      },
                    },
                    failed: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of failed services",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error",
          },
          "503": {
            description: "Service unhealthy (when auth/MongoDB is down)",
          },
        },
      },
    },
  },
};

export default openApiSpec;
