import type { AdapterConfig, AgentAdapter, ChatMessage } from "../types.js";
import { readSSEData } from "../streaming.js";

export class AnthropicAdapter implements AgentAdapter {
  readonly provider = "anthropic";
  private apiKey: string;
  private modelName: string;
  private baseUrl: string;

  constructor(config: AdapterConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
    this.modelName = config.model ?? "claude-opus-4-8";
    this.baseUrl = config.baseUrl ?? "https://api.anthropic.com/v1/messages";
  }

  get model(): string {
    return this.modelName;
  }

  private requestBody(messages: ChatMessage[], stream: boolean) {
    const system = messages.find((m) => m.role === "system")?.content;
    const rest = messages.filter((m) => m.role !== "system");
    return JSON.stringify({
      model: this.modelName,
      max_tokens: 4096,
      system,
      stream,
      messages: rest.map((m) => ({ role: m.role, content: m.content })),
    });
  }

  private headers(): Record<string, string> {
    return {
      "content-type": "application/json",
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
    };
  }

  async complete(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: this.headers(),
      body: this.requestBody(messages, false),
    });

    if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    return data.content.map((c) => c.text ?? "").join("");
  }

  async *stream(messages: ChatMessage[]): AsyncIterable<string> {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: this.headers(),
      body: this.requestBody(messages, true),
    });

    if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
    if (!res.body) throw new Error("Anthropic API response has no body");

    for await (const data of readSSEData(res.body)) {
      if (data === "[DONE]") return;
      const event = JSON.parse(data) as {
        type?: string;
        delta?: { type?: string; text?: string };
      };
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
        yield event.delta.text;
      }
    }
  }
}
