import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const requireC = createRequire(import.meta.url);
const { healthCheck } = requireC(
  "./template/base/js/src/modules/v1/health/health.controller.js"
);

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
