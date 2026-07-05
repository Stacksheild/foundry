import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
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

vi.mock("@foundry/agent-core", () => ({
  createAdapter: vi.fn(),
  pickAdapter: vi.fn(),
}));

process.env.FOUNDRY_REGISTRY_DB_PATH = ":memory:";

import { scanCommand } from "../commands/scan.js";
import { sandboxCommand } from "../commands/sandbox.js";
import { createCommand } from "../commands/create.js";
import { templatesCommand } from "../commands/templates.js";
import { configCommand } from "../commands/config.js";
import { chatCommand } from "../commands/chat.js";
import { appsCommand } from "../commands/apps.js";
import { deployCommand } from "../commands/deploy.js";
import { devCommand } from "../commands/dev.js";
import { runScan } from "@foundry/scanner-service";
import { createComputeProvider } from "@foundry/compute-providers";
import { createAdapter, pickAdapter } from "@foundry/agent-core";
import { getDb, registerApp, getApp } from "@foundry/app-registry";

describe("CLI command registration", () => {
  it("registers all top-level commands with the expected names", () => {
    expect(scanCommand.name()).toBe("scan");
    expect(sandboxCommand.name()).toBe("sandbox");
    expect(createCommand.name()).toBe("create");
    expect(templatesCommand.name()).toBe("templates");
    expect(configCommand.name()).toBe("config");
    expect(chatCommand.name()).toBe("chat");
    expect(appsCommand.name()).toBe("apps");
    expect(deployCommand.name()).toBe("deploy");
    expect(devCommand.name()).toBe("dev");
  });

  it("apps has ls/register/show subcommands", () => {
    expect(appsCommand.commands.map((c: Command) => c.name())).toEqual(["ls", "register", "show"]);
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

  it("falls back to foundry.config.yml's defaultTemplate when --template isn't passed", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-cli-test-"));
    const dest = join(tmp, "my-app");

    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmp);
    try {
      writeFileSync(join(tmp, "foundry.config.yml"), "defaultTemplate: crud-admin\n");
      await createCommand.parseAsync(["node", "foundry", "my-app"]);
      expect(existsSync(join(dest, "src/server.js"))).toBe(true);
      expect(existsSync(join(dest, "src/public/index.html"))).toBe(true);
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

describe("config command", () => {
  it("reports no config found when none exists", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-cli-test-"));
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmp);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await configCommand.parseAsync(["node", "foundry"]);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No foundry.config.yml found"));
    } finally {
      cwdSpy.mockRestore();
      logSpy.mockRestore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("prints the resolved config when one exists", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "foundry-cli-test-"));
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmp);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      writeFileSync(join(tmp, "foundry.config.yml"), "defaultTemplate: crud-admin\n");
      await configCommand.parseAsync(["node", "foundry"]);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Loaded from"));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("crud-admin"));
    } finally {
      cwdSpy.mockRestore();
      logSpy.mockRestore();
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

async function* fakeStream(chunks: string[]) {
  for (const c of chunks) yield c;
}

describe("chat command", () => {
  beforeEach(() => {
    vi.mocked(createAdapter).mockReset();
    vi.mocked(pickAdapter).mockReset();
  });

  it("uses model-router (pickAdapter) by default and streams the response", async () => {
    const mockAdapter = { provider: "anthropic", model: "claude-sonnet-4-20250514", stream: () => fakeStream(["Hel", "lo"]) };
    vi.mocked(pickAdapter).mockReturnValue({
      adapter: mockAdapter as never,
      recommendation: { selected: "anthropic/claude-sonnet-4-20250514", reasoning: "", rankings: [] },
    });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      await chatCommand.parseAsync(["node", "foundry", "hello there"]);
      expect(pickAdapter).toHaveBeenCalledWith({ taskType: undefined, prompt: "hello there" });
      const written = writeSpy.mock.calls.map((c) => c[0]).join("");
      expect(written).toContain("Hello");
    } finally {
      writeSpy.mockRestore();
    }
  });

  it("bypasses model-router when --provider is given", async () => {
    const mockAdapter = { provider: "ollama", model: "llama3", stream: () => fakeStream(["hi"]) };
    vi.mocked(createAdapter).mockReturnValue(mockAdapter as never);

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      await chatCommand.parseAsync(["node", "foundry", "hello", "--provider", "ollama"]);
      expect(createAdapter).toHaveBeenCalledWith("ollama", { model: undefined });
      expect(pickAdapter).not.toHaveBeenCalled();
    } finally {
      writeSpy.mockRestore();
    }
  });

  it("reports a clear error and sets a nonzero exit code on failure", async () => {
    vi.mocked(pickAdapter).mockImplementation(() => {
      throw new Error("no candidates");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await chatCommand.parseAsync(["node", "foundry", "hello"]);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Chat failed: no candidates"));
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = 0;
      errorSpy.mockRestore();
    }
  });
});

describe("apps command", () => {
  it("reports no apps registered yet, then registers and lists one", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await appsCommand.parseAsync(["node", "foundry", "ls"]);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No apps registered yet"));

      logSpy.mockClear();
      await appsCommand.parseAsync(["node", "foundry", "register", "checkout-svc", "--team", "Team Alpha"]);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Registered checkout-svc"));

      logSpy.mockClear();
      await appsCommand.parseAsync(["node", "foundry", "ls"]);
      const line = logSpy.mock.calls.map((c) => c[0]).join("\n");
      expect(line).toContain("checkout-svc");
      expect(line).toContain("Team Alpha");
    } finally {
      logSpy.mockRestore();
    }
  });

  it("show prints the full record as JSON, errors clearly for an unknown app", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await appsCommand.parseAsync(["node", "foundry", "show", "checkout-svc"]);
      const printed = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string);
      expect(printed.name).toBe("checkout-svc");

      await appsCommand.parseAsync(["node", "foundry", "show", "does-not-exist"]);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No app named "does-not-exist"'));
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = 0;
      logSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it("register reports a clear error for a duplicate name", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await appsCommand.parseAsync(["node", "foundry", "register", "checkout-svc"]);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("already registered"));
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = 0;
      errorSpy.mockRestore();
    }
  });
});

describe("deploy command", () => {
  const mockProvider = { create: vi.fn(), list: vi.fn(), destroy: vi.fn(), name: "exedev" };

  beforeEach(() => {
    vi.mocked(createComputeProvider).mockReturnValue(mockProvider as never);
    mockProvider.create.mockReset();
    mockProvider.destroy.mockReset();
  });

  it("errors clearly when the app isn't registered", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await deployCommand.parseAsync(["node", "foundry", "unregistered-svc"]);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("No app named"));
      expect(process.exitCode).toBe(1);
      expect(mockProvider.create).not.toHaveBeenCalled();
    } finally {
      process.exitCode = 0;
      errorSpy.mockRestore();
    }
  });

  it("provisions a VM and updates the registry with status/url/vmName", async () => {
    registerApp(getDb(), { name: "deploy-svc" });
    mockProvider.create.mockResolvedValue({
      name: "deploy-svc",
      httpsUrl: "https://deploy-svc.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "deploy-svc.exe.xyz",
    });

    await deployCommand.parseAsync(["node", "foundry", "deploy-svc", "--cpu", "2"]);

    expect(mockProvider.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "deploy-svc", cpu: 2 }),
    );
    const app = getApp(getDb(), "deploy-svc");
    expect(app).toMatchObject({
      status: "healthy",
      url: "https://deploy-svc.exe.xyz",
      vmName: "deploy-svc",
    });
  });

  it("destroys the previous VM on redeploy", async () => {
    mockProvider.create.mockResolvedValue({
      name: "deploy-svc",
      httpsUrl: "https://deploy-svc-2.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "deploy-svc-2.exe.xyz",
    });
    mockProvider.destroy.mockResolvedValue(undefined);

    await deployCommand.parseAsync(["node", "foundry", "deploy-svc"]);

    expect(mockProvider.destroy).toHaveBeenCalledWith("deploy-svc");
  });

  it("marks the app as error and surfaces the failure when provisioning fails", async () => {
    registerApp(getDb(), { name: "fails-svc" });
    mockProvider.create.mockRejectedValue(new Error("EXE_DEV_TOKEN is not set"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await deployCommand.parseAsync(["node", "foundry", "fails-svc"]);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Deploy failed"));
      expect(process.exitCode).toBe(1);
      expect(getApp(getDb(), "fails-svc")?.status).toBe("error");
    } finally {
      process.exitCode = 0;
      errorSpy.mockRestore();
    }
  });
});
