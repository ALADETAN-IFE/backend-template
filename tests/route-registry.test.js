import { describe, it, expect, beforeEach } from "vitest";
import { createRequire } from 'module';
import path from 'path';
const requireC = createRequire(import.meta.url);
const routeRegistryPath = path.join(process.cwd(), 'template', 'base', 'js', 'src', 'docs', 'route-registry.js');
const { routeRegistry } = requireC(routeRegistryPath);

describe("routeRegistry", () => {
  beforeEach(() => {
    // Clear registry
    routeRegistry.routes = [];
  });

  it("registers a route and generates OpenAPI paths", () => {
    routeRegistry.register({
      method: "GET",
      path: "/test",
      handler: () => {},
      docs: {
        summary: "test route",
        responses: { 200: { description: "ok" } },
      },
    });

    const spec = routeRegistry.generateOpenAPI("MyAPI", "1.0.0");
    expect(spec.paths["/test"]).toBeDefined();
    expect(spec.paths["/test"].get.summary).toBe("test route");
  });
});
