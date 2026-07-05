export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface AgentAdapter {
  readonly provider: string;
  readonly model: string;
  complete(messages: ChatMessage[]): Promise<string>;
}

export interface AdapterConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}
