import { AnthropicAdapter } from "./adapters/anthropic";
import { OpenAIAdapter } from "./adapters/openai";
import { OllamaAdapter } from "./adapters/ollama";
import type { AdapterConfig, AgentAdapter } from "./types";

export type { AgentAdapter, AdapterConfig, ChatMessage, ChatRole } from "./types";
export { AnthropicAdapter, OpenAIAdapter, OllamaAdapter };

export type Provider = "anthropic" | "openai" | "ollama";

export function createAdapter(provider: Provider, config: AdapterConfig = {}): AgentAdapter {
  switch (provider) {
    case "anthropic":
      return new AnthropicAdapter(config);
    case "openai":
      return new OpenAIAdapter(config);
    case "ollama":
      return new OllamaAdapter(config);
  }
}

export { pickAdapter, SUPPORTED_ROUTER_PROVIDERS } from "./router";
export type { PickAdapterResult } from "./router";
