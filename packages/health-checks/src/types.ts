export type CheckStatus = "pass" | "fail" | "skip" | "error";

export interface HealthCheckResult {
  name: string;
  status: CheckStatus;
  summary: string;
  durationMs: number;
}

export interface HealthCheck {
  name: string;
  run(targetPath: string): Promise<HealthCheckResult>;
}
