// Enhanced OpenAPI spec for health endpoint when auth is enabled
export const healthOpenApiWithMongo = {
  get: {
    tags: ["Health"],
    summary: "Health check with MongoDB status",
    description: "Returns API health, runtime metrics, and MongoDB connection status.",
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
        description: "Service unhealthy (when MongoDB is down)",
      },
    },
  },
};
