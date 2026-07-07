import { describe, it, expect, vi, beforeEach } from "vitest";
import { openDb } from "../db.js";
import { registerApp, getApp } from "../db.js";
import { deployApp, AppNotFoundError } from "../deploy.js";
import type { ComputeProvider } from "@foundry/compute-providers";

function mockProvider(): ComputeProvider {
  return { name: "exedev", create: vi.fn(), list: vi.fn(), destroy: vi.fn().mockResolvedValue(undefined) };
}

describe("deployApp", () => {
  let db: ReturnType<typeof openDb>;
  let provider: ComputeProvider;

  beforeEach(() => {
    db = openDb(":memory:");
    provider = mockProvider();
  });

  it("throws AppNotFoundError for an unregistered app, without calling create", async () => {
    await expect(deployApp(db, provider, "missing")).rejects.toThrow(AppNotFoundError);
    expect(provider.create).not.toHaveBeenCalled();
  });

  it("creates a VM and updates the registry with status/url/vmName", async () => {
    registerApp(db, { name: "deploy-svc" });
    vi.mocked(provider.create).mockResolvedValue({
      name: "deploy-svc",
      httpsUrl: "https://deploy-svc.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "deploy-svc.exe.xyz",
    });

    const result = await deployApp(db, provider, "deploy-svc", { cpu: 2 });

    expect(provider.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "deploy-svc", cpu: 2 }),
    );
    expect(result).toMatchObject({ status: "healthy", url: "https://deploy-svc.exe.xyz", vmName: "deploy-svc" });
    expect(getApp(db, "deploy-svc")).toMatchObject({ status: "healthy" });
  });

  it("destroys the previous VM before creating a fresh one on redeploy", async () => {
    registerApp(db, { name: "redeploy-svc" });
    vi.mocked(provider.create).mockResolvedValue({
      name: "redeploy-svc",
      httpsUrl: "https://redeploy-svc.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "redeploy-svc.exe.xyz",
    });
    await deployApp(db, provider, "redeploy-svc");
    vi.mocked(provider.destroy).mockClear();
    vi.mocked(provider.create).mockClear();

    vi.mocked(provider.create).mockResolvedValue({
      name: "redeploy-svc",
      httpsUrl: "https://redeploy-svc-2.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "redeploy-svc-2.exe.xyz",
    });
    await deployApp(db, provider, "redeploy-svc");

    expect(provider.destroy).toHaveBeenCalledWith("redeploy-svc");
  });

  it("does not let a destroy failure block the redeploy", async () => {
    registerApp(db, { name: "stale-vm-svc" });
    vi.mocked(provider.create).mockResolvedValue({
      name: "stale-vm-svc",
      httpsUrl: "https://stale-vm-svc.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "stale-vm-svc.exe.xyz",
    });
    await deployApp(db, provider, "stale-vm-svc");
    vi.mocked(provider.destroy).mockRejectedValue(new Error("VM already gone"));

    const result = await deployApp(db, provider, "stale-vm-svc");
    expect(result.status).toBe("healthy");
  });

  it("marks the app as error and rethrows when provisioning fails", async () => {
    registerApp(db, { name: "fails-svc" });
    vi.mocked(provider.create).mockRejectedValue(new Error("EXE_DEV_TOKEN is not set"));

    await expect(deployApp(db, provider, "fails-svc")).rejects.toThrow("EXE_DEV_TOKEN is not set");
    expect(getApp(db, "fails-svc")?.status).toBe("error");
  });
});
