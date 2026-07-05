import { describe, it, expect } from "vitest";
import { runHealthChecks } from "../runner.js";
import type { HealthCheck } from "../types.js";

describe("runHealthChecks", () => {
  it("runs all given checks and returns their results", async () => {
    const checks: HealthCheck[] = [
      { name: "a", run: async () => ({ name: "a", status: "pass", summary: "ok", durationMs: 1 }) },
      { name: "b", run: async () => ({ name: "b", status: "fail", summary: "nope", durationMs: 2 }) },
    ];

    const results = await runHealthChecks("/some/path", checks);
    expect(results.map((r) => r.name)).toEqual(["a", "b"]);
    expect(results.map((r) => r.status)).toEqual(["pass", "fail"]);
  });
});
