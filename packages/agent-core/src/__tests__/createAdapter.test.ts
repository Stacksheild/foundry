import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAdapter } from "../index";
import { AnthropicAdapter } from "../adapters/anthropic";
import { OpenAIAdapter } from "../adapters/openai";
import { OllamaAdapter } from "../adapters/ollama";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe("createAdapter", () => {
  it("builds an AnthropicAdapter and calls the Anthropic Messages API", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ content: [{ type: "text", text: "hi" }] }), { status: 200 }),
    );

    const adapter = createAdapter("anthropic", { model: "claude-sonnet-4-20250514" });
    expect(adapter).toBeInstanceOf(AnthropicAdapter);

    const result = await adapter.complete([{ role: "user", content: "hello" }]);
    expect(result).toBe("hi");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("AnthropicAdapter throws without an API key", async () => {
    const adapter = createAdapter("anthropic", { apiKey: "" });
    await expect(adapter.complete([{ role: "user", content: "hi" }])).rejects.toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });

  it("builds an OpenAIAdapter and calls the Chat Completions API", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "hi there" } }] }), {
        status: 200,
      }),
    );

    const adapter = createAdapter("openai", { apiKey: "test-key" });
    expect(adapter).toBeInstanceOf(OpenAIAdapter);

    const result = await adapter.complete([{ role: "user", content: "hello" }]);
    expect(result).toBe("hi there");
  });

  it("OpenAIAdapter surfaces a clear error on a non-OK response", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response("bad request", { status: 400 }));

    const adapter = createAdapter("openai", { apiKey: "test-key" });
    await expect(adapter.complete([{ role: "user", content: "hi" }])).rejects.toThrow(
      /OpenAI API error: 400/,
    );
  });

  it("builds an OllamaAdapter targeting the local endpoint", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: { content: "local hi" } }), { status: 200 }),
    );

    const adapter = createAdapter("ollama");
    expect(adapter).toBeInstanceOf(OllamaAdapter);
    expect(adapter.model).toBe("llama3");

    const result = await adapter.complete([{ role: "user", content: "hello" }]);
    expect(result).toBe("local hi");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:11434/api/chat",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
