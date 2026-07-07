import { describe, it, expect } from "vitest";
import { buildApp } from "../app.js";

describe("CORS", () => {
  it("reflects the request origin with an allow-origin header", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/apps",
      headers: { origin: "https://foundry-live-demo.vercel.app" },
    });
    expect(res.headers["access-control-allow-origin"]).toBe("https://foundry-live-demo.vercel.app");
    await app.close();
  });

  it("answers an OPTIONS preflight without requiring a bearer token", async () => {
    process.env.FOUNDRY_API_TOKEN = "secret123";
    const app = await buildApp();
    const res = await app.inject({
      method: "OPTIONS",
      url: "/apps/some-app/deploy",
      headers: {
        origin: "https://foundry-live-demo.vercel.app",
        "access-control-request-method": "POST",
      },
    });
    expect(res.statusCode).toBeLessThan(300);
    delete process.env.FOUNDRY_API_TOKEN;
    await app.close();
  });

  it("trims whitespace and filters empty entries in FOUNDRY_CORS_ORIGIN", async () => {
    process.env.FOUNDRY_CORS_ORIGIN = "https://a.example.com, https://b.example.com,";
    const app = await buildApp();

    const resA = await app.inject({
      method: "GET",
      url: "/apps",
      headers: { origin: "https://a.example.com" },
    });
    expect(resA.headers["access-control-allow-origin"]).toBe("https://a.example.com");

    const resB = await app.inject({
      method: "GET",
      url: "/apps",
      headers: { origin: "https://b.example.com" },
    });
    expect(resB.headers["access-control-allow-origin"]).toBe("https://b.example.com");

    delete process.env.FOUNDRY_CORS_ORIGIN;
    await app.close();
  });
});
