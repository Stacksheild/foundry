import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "../lib/relativeTime";

describe("formatRelativeTime", () => {
  it("formats a timestamp seconds ago as \"just now\"", () => {
    const now = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    expect(formatRelativeTime(now)).toBe("just now");
  });

  it("formats a timestamp minutes ago", () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    expect(formatRelativeTime(tenMinAgo)).toBe("10m ago");
  });

  it("formats a timestamp hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000).toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("formats a timestamp days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
    expect(formatRelativeTime(twoDaysAgo)).toBe("2d ago");
  });
});
