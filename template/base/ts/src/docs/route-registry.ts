import { RequestHandler } from "express";

export interface RouteDoc {
  tags?: string[];
  summary: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: "query" | "path" | "header" | "cookie";
    required?: boolean;
    schema: Record<string, unknown>;
    description?: string;
  }>;
  requestBody?: {
    required?: boolean;
    content: {
      "application/json": {
        schema: Record<string, unknown>;
      };
    };
  };
  responses: Record<number | string, {
    description: string;
    content?: {
      "application/json": {
        schema?: Record<string, unknown>;
      };
    };
  }>;
}

export interface RouteSchema {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  path: string;
  handler: RequestHandler | RequestHandler[];
  docs: RouteDoc;
}

class RouteRegistry {
  private routes: RouteSchema[] = [];

  register(route: RouteSchema): void {
    this.routes.push(route);
  }

  getRoutes(): RouteSchema[] {
    return this.routes;
  }

  generateOpenAPI(projectName: string, version = "1.0.0"): Record<string, unknown> {
    const paths: Record<string, unknown> = {};
    const tags = new Set<string>();

    // Collect all unique tags
    this.routes.forEach((route) => {
      route.docs.tags?.forEach((tag) => tags.add(tag));
    });

    // Build paths from routes
    this.routes.forEach((route) => {
      if (!paths[route.path]) {
        paths[route.path] = {};
      }

      const pathItem = paths[route.path] as Record<string, unknown>;
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

export const routeRegistry = new RouteRegistry();
