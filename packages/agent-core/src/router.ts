import { recommend } from "@sentinelai/model-router";
import type { RouteRequest, RouteRecommendation } from "@sentinelai/core";
import { createAdapter } from "./index.js";
import type { AgentAdapter, AdapterConfig } from "./types.js";

/**
 * Providers Foundry has a real AgentAdapter for. Deliberately narrower than
 * model-router's full profile list (which also covers google/mistral/deepseek)
 * and excludes ollama (model-router has no cost/latency data for local models).
 */
export const SUPPORTED_ROUTER_PROVIDERS = ["anthropic", "openai"] as const;
type SupportedRouterProvider = (typeof SUPPORTED_ROUTER_PROVIDERS)[number];

export interface PickAdapterResult {
  adapter: AgentAdapter;
  recommendation: RouteRecommendation;
}

/**
 * Ask sentinelai's model-router for the best model for a task/prompt, restricted
 * to providers Foundry can actually execute against, then build a ready-to-use
 * adapter for that recommendation via createAdapter().
 */
export function pickAdapter(request: RouteRequest, config: AdapterConfig = {}): PickAdapterResult {
  const recommendation = recommend(request, undefined, [...SUPPORTED_ROUTER_PROVIDERS]);

  if (recommendation.selected === "none") {
    throw new Error(
      `model-router found no candidates among supported providers (${SUPPORTED_ROUTER_PROVIDERS.join(", ")}): ${recommendation.reasoning}`,
    );
  }

  const [provider, ...modelParts] = recommendation.selected.split("/");
  const model = modelParts.join("/");
  if (!isSupportedProvider(provider)) {
    throw new Error(`model-router selected unsupported provider "${provider}"`);
  }

  const adapter = createAdapter(provider, { ...config, model });
  return { adapter, recommendation };
}

function isSupportedProvider(p: string): p is SupportedRouterProvider {
  return (SUPPORTED_ROUTER_PROVIDERS as readonly string[]).includes(p);
}
