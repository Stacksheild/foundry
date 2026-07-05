export type { HealthCheck, HealthCheckResult, CheckStatus } from "./types.js";
export { runHealthChecks } from "./runner.js";
export { securityScanCheck } from "./checks/security-scan.js";
export { unitTestCheck } from "./checks/unit-tests.js";
export { bundleSizeCheck } from "./checks/bundle-size.js";

import { securityScanCheck } from "./checks/security-scan.js";
import { unitTestCheck } from "./checks/unit-tests.js";
import { bundleSizeCheck } from "./checks/bundle-size.js";
import type { HealthCheck } from "./types.js";

/** The default check set `foundry check` runs when none are specified. */
export function defaultHealthChecks(): HealthCheck[] {
  return [securityScanCheck, unitTestCheck, bundleSizeCheck()];
}
