import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

const mockAdapter = {
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
  complete: vi.fn(),
  stream: vi.fn(),
};

vi.mock("@foundry/agent-core", () => ({
  createAdapter: vi.fn(() => mockAdapter),
  pickAdapter: vi.fn(() => ({
    adapter: mockAdapter,
    recommendation: { selected: "anthropic/x", reasoning: "", rankings: [] },
  })),
}));

async function* fakeStream(chunks: string[]) {
  for (const c of chunks) yield c;
}

describe("POST /build/chat — disabled by default", () => {
  it("registers no route when FOUNDRY_ENABLE_AGENT is unset", async () => {
    delete process.env.FOUNDRY_ENABLE_AGENT;
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url: "/build/chat", payload: { messages: [] } });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});

describe("POST /build/chat — enabled", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.FOUNDRY_ENABLE_AGENT = "true";
    app = await buildApp();
  });

  afterAll(async () => {
    delete process.env.FOUNDRY_ENABLE_AGENT;
    await app.close();
  });

  beforeEach(() => {
    mockAdapter.stream.mockReset();
  });

  it("streams the adapter's chunks back as the response body", async () => {
    mockAdapter.stream.mockReturnValue(fakeStream(["Hel", "lo"]));

    const res = await app.inject({
      method: "POST",
      url: "/build/chat",
      payload: { messages: [{ role: "user", content: "hi" }] },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("Hello");
  });

  it("returns 400 when messages is missing or empty", async () => {
    const res = await app.inject({ method: "POST", url: "/build/chat", payload: { messages: [] } });
    expect(res.statusCode).toBe(400);
  });

  it("writes a stream error into the response instead of throwing", async () => {
    // eslint-disable-next-line require-yield -- intentionally throws before ever yielding
    mockAdapter.stream.mockImplementation(async function* () {
      throw new Error("boom");
    });

    const res = await app.inject({
      method: "POST",
      url: "/build/chat",
      payload: { messages: [{ role: "user", content: "hi" }] },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("stream error: boom");
  });
});
