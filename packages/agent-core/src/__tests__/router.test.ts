import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentinelai/model-router", () => ({
  recommend: vi.fn(),
}));

import { recommend } from "@sentinelai/model-router";
import { pickAdapter, SUPPORTED_ROUTER_PROVIDERS } from "../router.js";
import { AnthropicAdapter } from "../adapters/anthropic.js";
import { OpenAIAdapter } from "../adapters/openai.js";

const mockRecommend = vi.mocked(recommend);

beforeEach(() => {
  mockRecommend.mockReset();
});

describe("pickAdapter", () => {
  it("restricts model-router to providers Foundry has adapters for", () => {
    mockRecommend.mockReturnValue({
      rankings: [],
      selected: "anthropic/claude-sonnet-4-20250514",
      reasoning: "test",
    });

    pickAdapter({ taskType: "code-generation" });

    expect(mockRecommend).toHaveBeenCalledWith(
      { taskType: "code-generation" },
      undefined,
      [...SUPPORTED_ROUTER_PROVIDERS],
    );
  });

  it("builds an AnthropicAdapter with the recommended model", () => {
    mockRecommend.mockReturnValue({
      rankings: [],
      selected: "anthropic/claude-sonnet-4-20250514",
      reasoning: "test",
    });

    const { adapter, recommendation } = pickAdapter({ taskType: "chat" });

    expect(adapter).toBeInstanceOf(AnthropicAdapter);
    expect(adapter.provider).toBe("anthropic");
    expect(adapter.model).toBe("claude-sonnet-4-20250514");
    expect(recommendation.selected).toBe("anthropic/claude-sonnet-4-20250514");
  });

  it("builds an OpenAIAdapter when openai is recommended", () => {
    mockRecommend.mockReturnValue({
      rankings: [],
      selected: "openai/gpt-4o",
      reasoning: "test",
    });

    const { adapter } = pickAdapter({ taskType: "chat" });

    expect(adapter).toBeInstanceOf(OpenAIAdapter);
    expect(adapter.model).toBe("gpt-4o");
  });

  it("throws when model-router finds no candidates", () => {
    mockRecommend.mockReturnValue({
      rankings: [],
      selected: "none",
      reasoning: "no models match the given constraints",
    });

    expect(() => pickAdapter({ taskType: "chat", maxCostPerMtok: 0 })).toThrow(
      /no candidates/,
    );
  });

  it("guards against an unsupported provider slipping through", () => {
    mockRecommend.mockReturnValue({
      rankings: [],
      selected: "google/gemini-2.0-flash",
      reasoning: "test",
    });

    expect(() => pickAdapter({ taskType: "chat" })).toThrow(/unsupported provider/);
  });
});
