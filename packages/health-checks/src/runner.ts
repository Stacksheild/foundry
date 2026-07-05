import type { HealthCheck, HealthCheckResult } from "./types.js";

export async function runHealthChecks(targetPath: string, checks: HealthCheck[]): Promise<HealthCheckResult[]> {
  return Promise.all(checks.map((check) => check.run(targetPath)));
}
