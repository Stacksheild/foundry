import { Command } from "commander";
import { runHealthChecks, defaultHealthChecks, type CheckStatus } from "@foundry/health-checks";

const STATUS_ICON: Record<CheckStatus, string> = {
  pass: "✓",
  fail: "✗",
  skip: "-",
  error: "!",
};

export const checkCommand = new Command("check")
  .description("Run pluggable health checks (security scan, unit tests, bundle size) against a directory")
  .argument("<path>", "Directory to check")
  .action(async (path: string) => {
    const results = await runHealthChecks(path, defaultHealthChecks());

    for (const result of results) {
      console.log(`${STATUS_ICON[result.status]} ${result.name}\t${result.summary}\t(${result.durationMs}ms)`);
    }

    const failed = results.filter((r) => r.status === "fail" || r.status === "error");
    if (failed.length > 0) {
      console.error(`\n${failed.length} check(s) failed.`);
      process.exitCode = 1;
    }
  });
