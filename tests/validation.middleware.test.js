import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const requireC = createRequire(import.meta.url);
const { validateRequest } = requireC(
  "./template/base/js/src/middlewares/validation.middleware.js"
);
const { z } = require("zod");

describe("validateRequest middleware", () => {
  it("parses and validates body and calls next on success", () => {
    const schema = z.object({ name: z.string() }).strict();
    const mw = validateRequest({ body: schema });

    const req = { body: { name: "alice" }, query: {}, params: {} };
    let called = false;
    const next = (err) => {
      if (err) throw err;
      called = true;
    };

    mw(req, null, next);
    expect(called).toBe(true);
    expect(req.body.name).toBe("alice");
  });

  it("passes ZodError to next on validation failure", () => {
    const schema = z.object({ name: z.string() }).strict();
    const mw = validateRequest({ body: schema });

    const req = { body: { name: 123 }, query: {}, params: {} };
    let calledErr = null;
    const next = (err) => {
      calledErr = err;
    };

    mw(req, null, next);
    expect(calledErr).not.toBeNull();
    expect(String(calledErr)).toContain("Request validation failed");
  });
});
