import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { scanPath } from "@sentinelai/scanner";
import type { ScanResult, Severity } from "@sentinelai/core";

export { formatTable, formatJson } from "@sentinelai/scanner";
export type { ScanResult, ScanFinding, TrustBand, ArtifactType, Severity } from "@sentinelai/core";

export interface RunScanOptions {
  /** Minimum severity to include in returned findings (default "low"). */
  minSeverity?: Severity;
}

const SEVERITY_ORDER: Severity[] = ["info", "low", "medium", "high", "critical"];

/**
 * Runs sentinelai's security scanner against a path and filters findings by
 * severity. This is the single place Foundry invokes @sentinelai/scanner —
 * both apps/api's /scan route and packages/cli's `scan` command call this,
 * so severity-filtering semantics live in exactly one place.
 */
export function runScan(targetPath: string, options: RunScanOptions = {}): ScanResult[] {
  const resolved = resolve(targetPath);
  if (!existsSync(resolved)) {
    throw new Error(`Scan target does not exist: ${resolved}`);
  }

  const minIdx = SEVERITY_ORDER.indexOf(options.minSeverity ?? "low");
  const results = scanPath(resolved);
  return results.map((r) => ({
    ...r,
    findings: r.findings.filter((f) => SEVERITY_ORDER.indexOf(f.severity) >= minIdx),
  }));
}
