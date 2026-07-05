import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import type { HealthCheck, HealthCheckResult } from "../types.js";

const PLACEHOLDER_TEST_SCRIPT = 'echo "Error: no test specified" && exit 1';
const TIMEOUT_MS = 30_000;

/**
 * Runs a shell command directly (not through `npm test`, which spawns the
 * full npm CLI and can hang indefinitely on its own network/update-check
 * behavior — observed in practice, not theoretical). Runs in its own process
 * group so a timeout can kill the whole tree, not just the immediate child;
 * a lone SIGTERM/SIGKILL to the top process can leave grandchildren holding
 * stdio open forever.
 */
function runCommand(command: string, cwd: string): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd, shell: true, detached: true });
    let output = "";

    const timer = setTimeout(() => {
      if (child.pid) {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          // already exited
        }
      }
    }, TIMEOUT_MS);

    child.stdout?.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.stderr?.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/** Runs the target's test script directly if a real (non-placeholder) one exists. */
export const unitTestCheck: HealthCheck = {
  name: "unit-tests",
  async run(targetPath: string): Promise<HealthCheckResult> {
    const start = Date.now();
    const pkgPath = join(targetPath, "package.json");
    if (!existsSync(pkgPath)) {
      return { name: "unit-tests", status: "skip", summary: "No package.json found", durationMs: Date.now() - start };
    }

    let testScript: string | undefined;
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { scripts?: Record<string, string> };
      testScript = pkg.scripts?.test;
    } catch (err) {
      return {
        name: "unit-tests",
        status: "error",
        summary: `Couldn't parse package.json: ${err instanceof Error ? err.message : String(err)}`,
        durationMs: Date.now() - start,
      };
    }

    if (!testScript || testScript.trim() === PLACEHOLDER_TEST_SCRIPT) {
      return { name: "unit-tests", status: "skip", summary: "No test script defined", durationMs: Date.now() - start };
    }

    try {
      const { code, output } = await runCommand(testScript, targetPath);
      const lastLine = output.trim().split("\n").at(-1) ?? "";
      return {
        name: "unit-tests",
        status: code === 0 ? "pass" : "fail",
        summary: lastLine || (code === 0 ? "Tests passed" : `Exited with code ${code}`),
        durationMs: Date.now() - start,
      };
    } catch (err) {
      return {
        name: "unit-tests",
        status: "error",
        summary: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      };
    }
  },
};
