import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { runScan } from "../index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(
  __dirname,
  "../../../../vendor/sentinelai/packages/scanner/src/__tests__/fixtures",
);

describe("runScan", () => {
  it("flags a malicious skill with a red trust band and critical findings", () => {
    const [result] = runScan(resolve(FIXTURES, "malicious-skill"));

    expect(result).toBeDefined();
    expect(result!.trustBand).toBe("red");
    expect(result!.findings.some((f) => f.severity === "critical")).toBe(true);
  });

  it("does not flag a clean skill", () => {
    const [result] = runScan(resolve(FIXTURES, "clean-skill"));

    expect(result).toBeDefined();
    expect(result!.trustBand).not.toBe("red");
  });

  it("filters findings by minSeverity", () => {
    const all = runScan(resolve(FIXTURES, "malicious-skill"));
    const criticalOnly = runScan(resolve(FIXTURES, "malicious-skill"), {
      minSeverity: "critical",
    });

    expect(criticalOnly[0]!.findings.length).toBeLessThan(all[0]!.findings.length);
    expect(criticalOnly[0]!.findings.every((f) => f.severity === "critical")).toBe(true);
  });

  it("throws a clear error for a nonexistent path", () => {
    expect(() => runScan(resolve(FIXTURES, "does-not-exist"))).toThrow(/does not exist/);
  });
});
