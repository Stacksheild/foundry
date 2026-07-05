import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Command } from "commander";

vi.mock("@foundry/scanner-service", () => ({
  runScan: vi.fn(),
  formatTable: vi.fn((r) => `table:${r.target}`),
  formatJson: vi.fn((r) => `json:${r.target}`),
}));

vi.mock("@foundry/compute-providers", () => ({
  createComputeProvider: vi.fn(),
}));

import { scanCommand } from "../commands/scan.js";
import { sandboxCommand } from "../commands/sandbox.js";
import { createCommand } from "../commands/create.js";
import { templatesCommand } from "../commands/templates.js";
import { devCommand } from "../commands/dev.js";
import { runScan } from "@foundry/scanner-service";
import { createComputeProvider } from "@foundry/compute-providers";

describe("CLI command registration", () => {
  it("registers all top-level commands with the expected names", () => {
    expect(scanCommand.name()).toBe("scan");
    expect(sandboxCommand.name()).toBe("sandbox");
    expect(createCommand.name()).toBe("create");
    expect(templatesCommand.name()).toBe("templates");
    expect(devCommand.name()).toBe("dev");
  });

  it("sandbox has new/ls/rm subcommands", () => {
    expect(sandboxCommand.commands.map((c: Command) => c.name())).toEqual(["new", "ls", "rm"]);
  });
});

describe("scan command", () => {
  beforeEach(() => {
    vi.mocked(runScan).mockReset();
  });

  it("calls runScan with the given path and severity", async () => {
    vi.mocked(runScan).mockReturnValue([]);
    await scanCommand.parseAsync(["node", "foundry", "some/path", "--severity", "high"]);
    expect(runScan).toHaveBeenCalledWith("some/path", { minSeverity: "high" });
  });
});

describe("sandbox commands", () => {
  const mockProvider = { create: vi.fn(), list: vi.fn(), destroy: vi.fn(), name: "exedev" };

  beforeEach(() => {
    vi.mocked(createComputeProvider).mockReturnValue(mockProvider as never);
    mockProvider.create.mockReset();
    mockProvider.list.mockReset();
    mockProvider.destroy.mockReset();
  });

  it("sandbox new creates a VM with parsed options", async () => {
    mockProvider.create.mockResolvedValue({
      name: "foo",
      httpsUrl: "https://foo.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "foo.exe.xyz",
    });

    await sandboxCommand.parseAsync(["node", "foundry", "new", "foo", "--cpu", "2"]);

    expect(mockProvider.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "foo", cpu: 2 }),
    );
  });

  it("sandbox rm destroys the named VM", async () => {
    mockProvider.destroy.mockResolvedValue(undefined);
    await sandboxCommand.parseAsync(["node", "foundry", "rm", "foo"]);
    expect(mockProvider.destroy).toHaveBeenCalledWith("foo");
  });
});

describe("create command", () => {
  it("copies the minimal template into a new directory by default, without the manifest", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-cli-test-"));
    const dest = join(tmp, "my-app");

    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmp);
    try {
      await createCommand.parseAsync(["node", "foundry", "my-app"]);
      expect(existsSync(join(dest, "package.json"))).toBe(true);
      expect(readFileSync(join(dest, "src/index.js"), "utf-8")).toContain("Hello from your new Foundry app");
      expect(existsSync(join(dest, "foundry.plugin.json"))).toBe(false);
    } finally {
      cwdSpy.mockRestore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("scaffolds a different template via --template", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-cli-test-"));
    const dest = join(tmp, "my-dash");

    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmp);
    try {
      await createCommand.parseAsync(["node", "foundry", "my-dash", "--template", "metrics-dashboard"]);
      expect(existsSync(join(dest, "src/server.js"))).toBe(true);
      expect(existsSync(join(dest, "src/public/index.html"))).toBe(true);
    } finally {
      cwdSpy.mockRestore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("errors clearly for an unknown template", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-cli-test-"));
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmp);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await createCommand.parseAsync(["node", "foundry", "my-app", "--template", "does-not-exist"]);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown template"));
      expect(existsSync(join(tmp, "my-app"))).toBe(false);
    } finally {
      cwdSpy.mockRestore();
      errorSpy.mockRestore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("refuses to overwrite an existing directory", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-cli-test-"));

    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmp);
    try {
      await createCommand.parseAsync(["node", "foundry", "my-app"]);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await createCommand.parseAsync(["node", "foundry", "my-app"]);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("already exists"));
      errorSpy.mockRestore();
    } finally {
      cwdSpy.mockRestore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe("templates command", () => {
  it("lists all four first-party templates", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await templatesCommand.parseAsync(["node", "foundry"]);
      const ids = logSpy.mock.calls.map((call) => call[0].split("\t")[0]);
      expect(ids.sort()).toEqual(
        ["crud-admin", "metrics-dashboard", "minimal", "service-catalog-entry"].sort(),
      );
    } finally {
      logSpy.mockRestore();
    }
  });
});
