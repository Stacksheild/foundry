import { runScan } from "@foundry/scanner-service";
import type { HealthCheck, HealthCheckResult } from "../types.js";

/** Real security scan via @sentinelai/scanner (same engine as apps/api's /scan and `foundry scan`). */
export const securityScanCheck: HealthCheck = {
  name: "security-scan",
  async run(targetPath: string): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const results = runScan(targetPath, { minSeverity: "high" });
      const criticalFindings = results.flatMap((r) => r.findings).filter((f) => f.severity === "critical");
      const highFindings = results.flatMap((r) => r.findings).filter((f) => f.severity === "high");

      if (results.length === 0) {
        return {
          name: "security-scan",
          status: "skip",
          summary: "No scannable artifacts (skills, MCP configs, hooks) found",
          durationMs: Date.now() - start,
        };
      }

      const status = criticalFindings.length > 0 ? "fail" : "pass";
      return {
        name: "security-scan",
        status,
        summary: `${criticalFindings.length} critical, ${highFindings.length} high severity finding(s) across ${results.length} artifact(s)`,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      return {
        name: "security-scan",
        status: "error",
        summary: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      };
    }
  },
};
