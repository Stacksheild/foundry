import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("GET /build/sessions — disabled by default", () => {
  it("registers no route when FOUNDRY_ENABLE_AGENT is unset", async () => {
    delete process.env.FOUNDRY_ENABLE_AGENT;
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/build/sessions" });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});

describe("GET /build/sessions — enabled", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.FOUNDRY_ENABLE_AGENT = "true";
    process.env.FOUNDRY_DB_PATH = ":memory:";
    app = await buildApp();
  });

  afterAll(async () => {
    delete process.env.FOUNDRY_ENABLE_AGENT;
    delete process.env.FOUNDRY_DB_PATH;
    await app.close();
  });

  it("returns an empty list when no sessions exist yet", async () => {
    const res = await app.inject({ method: "GET", url: "/build/sessions" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ sessions: [] });
  });

  it("returns 400 for a non-integer id", async () => {
    const res = await app.inject({ method: "GET", url: "/build/sessions/not-a-number" });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for an unknown session id", async () => {
    const res = await app.inject({ method: "GET", url: "/build/sessions/999999" });
    expect(res.statusCode).toBe(404);
  });
});
