import { Command } from "commander";
import { runScan, formatTable, formatJson, type Severity } from "@foundry/scanner-service";

export const scanCommand = new Command("scan")
  .description("Scan a directory for security issues in AI artifacts (skills, MCP configs, hooks)")
  .argument("<path>", "Path to scan")
  .option("-f, --format <format>", "table or json", "table")
  .option("-s, --severity <level>", "minimum severity: critical|high|medium|low|info", "low")
  .action((targetPath: string, opts: { format: string; severity: string }) => {
    try {
      const results = runScan(targetPath, { minSeverity: opts.severity as Severity });
      if (results.length === 0) {
        console.log(`No scannable artifacts (skills, MCP configs, hooks) found under ${targetPath}`);
        return;
      }
      const format = opts.format === "json" ? formatJson : formatTable;
      for (const result of results) {
        console.log(format(result));
      }
    } catch (err) {
      console.error(`Scan failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    }
  });
