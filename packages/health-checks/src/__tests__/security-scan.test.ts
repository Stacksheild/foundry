import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { securityScanCheck } from "../checks/security-scan.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "../../../../vendor/sentinelai/packages/scanner/src/__tests__/fixtures");

describe("securityScanCheck", () => {
  it("fails on a malicious skill fixture (real critical findings)", async () => {
    const result = await securityScanCheck.run(resolve(FIXTURES, "malicious-skill"));
    expect(result.status).toBe("fail");
    expect(result.summary).toMatch(/critical/);
  });

  it("passes on a clean skill fixture", async () => {
    const result = await securityScanCheck.run(resolve(FIXTURES, "clean-skill"));
    expect(result.status).toBe("pass");
  });

  it("skips when there's nothing scannable", async () => {
    const result = await securityScanCheck.run(__dirname); // this test dir has no skill.md/mcp/hooks
    expect(result.status).toBe("skip");
  });
});
