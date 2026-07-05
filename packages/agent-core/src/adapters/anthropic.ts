import type { AdapterConfig, AgentAdapter, ChatMessage } from "../types";

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

  async complete(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    const system = messages.find((m) => m.role === "system")?.content;
    const rest = messages.filter((m) => m.role !== "system");

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.modelName,
        max_tokens: 4096,
        system,
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    return data.content.map((c) => c.text ?? "").join("");
  }
}
