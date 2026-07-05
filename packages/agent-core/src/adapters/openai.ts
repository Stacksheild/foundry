import type { AdapterConfig, AgentAdapter, ChatMessage } from "../types.js";
import { readSSEData } from "../streaming.js";

export class OpenAIAdapter implements AgentAdapter {
  readonly provider = "openai";
  private apiKey: string;
  private modelName: string;
  private baseUrl: string;

  constructor(config: AdapterConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.modelName = config.model ?? "gpt-4o";
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1/chat/completions";
  }

  get model(): string {
    return this.modelName;
  }

  private headers(): Record<string, string> {
    return {
      "content-type": "application/json",
      authorization: `Bearer ${this.apiKey}`,
    };
  }

  async complete(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is not set");

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ model: this.modelName, messages }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message.content ?? "";
  }

  async *stream(messages: ChatMessage[]): AsyncIterable<string> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is not set");

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ model: this.modelName, messages, stream: true }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
    if (!res.body) throw new Error("OpenAI API response has no body");

    for await (const data of readSSEData(res.body)) {
      if (data === "[DONE]") return;
      const event = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
      const delta = event.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
