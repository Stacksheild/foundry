import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("apps registry routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.FOUNDRY_REGISTRY_DB_PATH = ":memory:";
    app = await buildApp();
  });

  afterAll(async () => {
    delete process.env.FOUNDRY_REGISTRY_DB_PATH;
    await app.close();
  });

  it("starts with an empty registry", async () => {
    const res = await app.inject({ method: "GET", url: "/apps" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ apps: [] });
  });

  it("registers a new app and returns 201", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/apps",
      payload: { name: "checkout-svc", team: "Team Alpha" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ name: "checkout-svc", team: "Team Alpha", status: "healthy" });
  });

  it("returns 400 when name is missing", async () => {
    const res = await app.inject({ method: "POST", url: "/apps", payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it("returns 409 for a duplicate name", async () => {
    await app.inject({ method: "POST", url: "/apps", payload: { name: "dup-svc" } });
    const res = await app.inject({ method: "POST", url: "/apps", payload: { name: "dup-svc" } });
    expect(res.statusCode).toBe(409);
  });

  it("gets a single app by name, 404 for unknown", async () => {
    await app.inject({ method: "POST", url: "/apps", payload: { name: "solo-svc" } });
    const found = await app.inject({ method: "GET", url: "/apps/solo-svc" });
    expect(found.statusCode).toBe(200);
    expect(found.json().name).toBe("solo-svc");

    const missing = await app.inject({ method: "GET", url: "/apps/does-not-exist" });
    expect(missing.statusCode).toBe(404);
  });

  it("updates an app's status/url, 404 for unknown", async () => {
    await app.inject({ method: "POST", url: "/apps", payload: { name: "patch-svc" } });
    const res = await app.inject({
      method: "PATCH",
      url: "/apps/patch-svc",
      payload: { status: "deploying", url: "https://patch-svc.example.com" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "deploying", url: "https://patch-svc.example.com" });

    const missing = await app.inject({ method: "PATCH", url: "/apps/does-not-exist", payload: { status: "error" } });
    expect(missing.statusCode).toBe(404);
  });

  it("lists all registered apps newest first", async () => {
    const res = await app.inject({ method: "GET", url: "/apps" });
    const names = res.json().apps.map((a: { name: string }) => a.name);
    expect(names).toContain("checkout-svc");
    expect(names).toContain("patch-svc");
    expect(names.indexOf("patch-svc")).toBeLessThan(names.indexOf("checkout-svc"));
  });
});
