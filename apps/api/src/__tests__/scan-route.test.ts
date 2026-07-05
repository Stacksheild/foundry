import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MALICIOUS_FIXTURE = resolve(
  __dirname,
  "../../../../vendor/sentinelai/packages/scanner/src/__tests__/fixtures/malicious-skill",
);

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe("POST /scan", () => {
  it("returns real scan results for a valid path", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/scan",
      payload: { path: MALICIOUS_FIXTURE },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.results[0].trustBand).toBe("red");
  });

  it("returns 400 when path is missing", async () => {
    const res = await app.inject({ method: "POST", url: "/scan", payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it("returns 422 for a nonexistent path", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/scan",
      payload: { path: resolve(__dirname, "does-not-exist") },
    });
    expect(res.statusCode).toBe(422);
  });
});
