import { describe, it, expect } from "vitest";
process.env.PORT = process.env.PORT || '4000';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
import { createRequire } from 'module';
import path from 'path';
const requireC = createRequire(import.meta.url);
const healthPath = path.join(process.cwd(), 'template', 'base', 'js', 'src', 'modules', 'v1', 'health', 'health.controller.js');
const { healthCheck } = requireC(healthPath);

describe("health controller", () => {
  it("returns healthy JSON with memory info", async () => {
    const res = {
      status(code) {
        this.code = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
    };

    await healthCheck(null, res);
    expect(res.code).toBe(200);
    expect(res.payload).toHaveProperty("status", "healthy");
    expect(res.payload).toHaveProperty("services");
    expect(res.payload.services).toHaveProperty("memory");
  });
});
