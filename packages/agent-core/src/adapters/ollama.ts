import type { AdapterConfig, AgentAdapter, ChatMessage } from "../types";

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
}
