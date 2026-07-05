import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bundleSizeCheck } from "../checks/bundle-size.js";

let tmp: string;

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

describe("bundleSizeCheck", () => {
  it("skips when there's no recognizable entry point", async () => {
    tmp = mkdtempSync(join(tmpdir(), "foundry-health-check-test-"));
    const result = await bundleSizeCheck().run(tmp);
    expect(result.status).toBe("skip");
  });

  it("passes a small file under the threshold", async () => {
    tmp = mkdtempSync(join(tmpdir(), "foundry-health-check-test-"));
    mkdirSync(join(tmp, "src"));
    writeFileSync(join(tmp, "src", "index.js"), 'console.log("hello")');

    const result = await bundleSizeCheck(200 * 1024).run(tmp);
    expect(result.status).toBe("pass");
    expect(result.summary).toMatch(/KB/);
  });

  it("fails a file over a deliberately tiny threshold", async () => {
    tmp = mkdtempSync(join(tmpdir(), "foundry-health-check-test-"));
    mkdirSync(join(tmp, "src"));
    writeFileSync(join(tmp, "src", "index.js"), 'console.log("hello")');

    const result = await bundleSizeCheck(1).run(tmp); // 1 byte threshold — anything real fails it
    expect(result.status).toBe("fail");
  });
});
