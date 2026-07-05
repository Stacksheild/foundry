import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAdapter } from "../index.js";
import { AnthropicAdapter } from "../adapters/anthropic.js";
import { OpenAIAdapter } from "../adapters/openai.js";
import { OllamaAdapter } from "../adapters/ollama.js";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

function textStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) controller.enqueue(encoder.encode(chunks[i++]));
      else controller.close();
    },
  });
}

async function collect(iter: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const chunk of iter) out += chunk;
  return out;
}

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

  it("AnthropicAdapter streams text deltas from SSE events", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    const sse =
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hel"}}\n\n' +
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"lo"}}\n\n' +
      "data: [DONE]\n\n";
    vi.mocked(global.fetch).mockResolvedValue(new Response(textStream([sse]), { status: 200 }));

    const adapter = createAdapter("anthropic", { apiKey: "test-key" });
    const result = await collect(adapter.stream([{ role: "user", content: "hi" }]));
    expect(result).toBe("Hello");
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

  it("OpenAIAdapter streams delta content from SSE events", async () => {
    const sse =
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n' +
      "data: [DONE]\n\n";
    vi.mocked(global.fetch).mockResolvedValue(new Response(textStream([sse]), { status: 200 }));

    const adapter = createAdapter("openai", { apiKey: "test-key" });
    const result = await collect(adapter.stream([{ role: "user", content: "hi" }]));
    expect(result).toBe("Hello");
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

  it("OllamaAdapter streams content from newline-delimited JSON", async () => {
    const ndjson =
      '{"message":{"content":"Hel"},"done":false}\n' + '{"message":{"content":"lo"},"done":true}\n';
    vi.mocked(global.fetch).mockResolvedValue(new Response(textStream([ndjson]), { status: 200 }));

    const adapter = createAdapter("ollama");
    const result = await collect(adapter.stream([{ role: "user", content: "hi" }]));
    expect(result).toBe("Hello");
  });
});
