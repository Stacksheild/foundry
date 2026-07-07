import { describe, it, expect, afterEach } from "vitest";
import { buildApp } from "../app.js";

describe("FOUNDRY_API_TOKEN gating", () => {
  afterEach(() => {
    delete process.env.FOUNDRY_API_TOKEN;
  });

  it("does not require a token when FOUNDRY_API_TOKEN is unset", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/apps" });
    expect(res.statusCode).toBe(200);
    await app.close();
  });

  it("rejects missing/wrong tokens and allows the right one when set", async () => {
    process.env.FOUNDRY_API_TOKEN = "secret123";
    const app = await buildApp();

    const noAuth = await app.inject({ method: "GET", url: "/apps" });
    expect(noAuth.statusCode).toBe(401);

    const wrongAuth = await app.inject({ method: "GET", url: "/apps", headers: { authorization: "Bearer wrong" } });
    expect(wrongAuth.statusCode).toBe(401);

    const rightAuth = await app.inject({
      method: "GET",
      url: "/apps",
      headers: { authorization: "Bearer secret123" },
    });
    expect(rightAuth.statusCode).toBe(200);

    await app.close();
  });

  it("never gates GET /health, even when a token is set", async () => {
    process.env.FOUNDRY_API_TOKEN = "secret123";
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    await app.close();
  });
});
