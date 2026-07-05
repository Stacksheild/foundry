import { AnthropicAdapter } from "./adapters/anthropic.js";
import { OpenAIAdapter } from "./adapters/openai.js";
import { OllamaAdapter } from "./adapters/ollama.js";
import type { AdapterConfig, AgentAdapter } from "./types.js";

export type { AgentAdapter, AdapterConfig, ChatMessage, ChatRole } from "./types.js";
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

export { pickAdapter, SUPPORTED_ROUTER_PROVIDERS } from "./router.js";
export type { PickAdapterResult } from "./router.js";
