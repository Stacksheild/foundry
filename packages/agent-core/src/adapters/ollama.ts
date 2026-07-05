import type { AdapterConfig, AgentAdapter, ChatMessage } from "../types.js";
import { readLines } from "../streaming.js";

export class OllamaAdapter implements AgentAdapter {
  readonly provider = "ollama";
  private modelName: string;
  private baseUrl: string;

  constructor(config: AdapterConfig = {}) {
    this.modelName = config.model ?? "llama3";
    this.baseUrl = config.baseUrl ?? "http://localhost:11434/api/chat";
  }

  get model(): string {
    return this.modelName;
  }

  async complete(messages: ChatMessage[]): Promise<string> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: this.modelName, messages, stream: false }),
    });

    if (!res.ok) throw new Error(`Ollama API error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { message: { content: string } };
    return data.message.content;
  }

  async *stream(messages: ChatMessage[]): AsyncIterable<string> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: this.modelName, messages, stream: true }),
    });

    if (!res.ok) throw new Error(`Ollama API error: ${res.status} ${await res.text()}`);
    if (!res.body) throw new Error("Ollama API response has no body");

    // Ollama streams newline-delimited JSON objects, not SSE.
    for await (const line of readLines(res.body)) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
      if (event.message?.content) yield event.message.content;
      if (event.done) return;
    }
  }
}
