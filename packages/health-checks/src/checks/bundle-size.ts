import { build } from "esbuild";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { HealthCheck, HealthCheckResult } from "../types.js";

const CANDIDATE_ENTRIES = ["src/index.js", "src/server.js", "index.js"];
const DEFAULT_THRESHOLD_BYTES = 200 * 1024; // 200 KB

/** Bundles+minifies the target's entry point with real esbuild (native, not the WASM build
 * preview-engine uses for the browser) and reports size against a threshold. */
export function bundleSizeCheck(thresholdBytes: number = DEFAULT_THRESHOLD_BYTES): HealthCheck {
  return {
    name: "bundle-size",
    async run(targetPath: string): Promise<HealthCheckResult> {
      const start = Date.now();
      const entry = CANDIDATE_ENTRIES.map((e) => join(targetPath, e)).find((p) => existsSync(p));
      if (!entry) {
        return {
          name: "bundle-size",
          status: "skip",
          summary: `No entry point found (checked ${CANDIDATE_ENTRIES.join(", ")})`,
          durationMs: Date.now() - start,
        };
      }

      try {
        const result = await build({
          entryPoints: [entry],
          bundle: true,
          minify: true,
          write: false,
          platform: "node",
          format: "esm",
        });
        const bytes = result.outputFiles?.[0]?.contents.byteLength ?? 0;
        const status = bytes > thresholdBytes ? "fail" : "pass";
        return {
          name: "bundle-size",
          status,
          summary: `${(bytes / 1024).toFixed(1)} KB (threshold ${(thresholdBytes / 1024).toFixed(0)} KB)`,
          durationMs: Date.now() - start,
        };
      } catch (err) {
        return {
          name: "bundle-size",
          status: "error",
          summary: err instanceof Error ? err.message : String(err),
          durationMs: Date.now() - start,
        };
      }
    },
  };
}
