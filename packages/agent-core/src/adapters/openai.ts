import type { AdapterConfig, AgentAdapter, ChatMessage } from "../types";

export class OpenAIAdapter implements AgentAdapter {
  readonly provider = "openai";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: AdapterConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.model = config.model ?? "gpt-4o";
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1/chat/completions";
  }

  async complete(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is not set");

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, messages }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message.content ?? "";
  }
}
