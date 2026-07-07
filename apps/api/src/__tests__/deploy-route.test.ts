import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

const mockProvider = { name: "exedev", create: vi.fn(), list: vi.fn(), destroy: vi.fn() };

vi.mock("@foundry/compute-providers", () => ({
  createComputeProvider: vi.fn(() => mockProvider),
}));

describe("POST /apps/:name/deploy", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.FOUNDRY_REGISTRY_DB_PATH = ":memory:";
    app = await buildApp();
  });

  afterAll(async () => {
    delete process.env.FOUNDRY_REGISTRY_DB_PATH;
    await app.close();
  });

  beforeEach(() => {
    mockProvider.create.mockReset();
    mockProvider.destroy.mockReset();
  });

  it("returns 404 for an unregistered app", async () => {
    const res = await app.inject({ method: "POST", url: "/apps/does-not-exist/deploy" });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toContain("No app named");
  });

  it("provisions a VM and returns the updated record", async () => {
    await app.inject({ method: "POST", url: "/apps", payload: { name: "web-deploy-svc" } });
    mockProvider.create.mockResolvedValue({
      name: "web-deploy-svc",
      httpsUrl: "https://web-deploy-svc.exe.xyz",
      region: "lon",
      status: "running",
      sshDest: "web-deploy-svc.exe.xyz",
    });

    const res = await app.inject({ method: "POST", url: "/apps/web-deploy-svc/deploy" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      status: "healthy",
      url: "https://web-deploy-svc.exe.xyz",
      vmName: "web-deploy-svc",
    });
  });

  it("returns 422 with the provider's error message when provisioning fails", async () => {
    await app.inject({ method: "POST", url: "/apps", payload: { name: "web-fails-svc" } });
    mockProvider.create.mockRejectedValue(new Error("Choose a plan to start creating VMs."));

    const res = await app.inject({ method: "POST", url: "/apps/web-fails-svc/deploy" });

    expect(res.statusCode).toBe(422);
    expect(res.json().error).toBe("Choose a plan to start creating VMs.");
  });
});
