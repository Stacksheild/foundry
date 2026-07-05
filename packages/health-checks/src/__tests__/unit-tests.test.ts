import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unitTestCheck } from "../checks/unit-tests.js";

let tmp: string;

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

function writePkg(scripts: Record<string, string> = {}) {
  tmp = mkdtempSync(join(tmpdir(), "foundry-health-check-test-"));
  writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "fixture", scripts }));
  return tmp;
}

describe("unitTestCheck", () => {
  it("skips when there's no package.json", async () => {
    tmp = mkdtempSync(join(tmpdir(), "foundry-health-check-test-"));
    const result = await unitTestCheck.run(tmp);
    expect(result.status).toBe("skip");
  });

  it("skips when there's no test script", async () => {
    const dir = writePkg({});
    const result = await unitTestCheck.run(dir);
    expect(result.status).toBe("skip");
  });

  it("skips the default npm-init placeholder test script", async () => {
    const dir = writePkg({ test: 'echo "Error: no test specified" && exit 1' });
    const result = await unitTestCheck.run(dir);
    expect(result.status).toBe("skip");
  });

  it("passes when the real test script exits 0", async () => {
    const dir = writePkg({ test: "node -e \"console.log('3 passed')\"" });
    const result = await unitTestCheck.run(dir);
    expect(result.status).toBe("pass");
    expect(result.summary).toContain("3 passed");
  }, 10_000);

  it("fails when the real test script exits non-zero", async () => {
    const dir = writePkg({ test: "node -e \"process.exit(1)\"" });
    const result = await unitTestCheck.run(dir);
    expect(result.status).toBe("fail");
  }, 10_000);
});
