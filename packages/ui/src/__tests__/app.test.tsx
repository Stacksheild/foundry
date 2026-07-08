import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { App } from "../App";

// This project's vitest config does not enable `test.globals`, so
// @testing-library/react's implicit afterEach-cleanup auto-registration
// (which checks for a global `afterEach`) never fires. Multiple renders of
// the same screen within this file would otherwise leak DOM nodes across
// tests, so clean up explicitly.
afterEach(() => {
  cleanup();
});

describe("App — live mode (apiBaseUrl set)", () => {
  it("fetches /build/sessions on mount with a bearer header and seeds the sidebar", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sessions: [{ id: 7, title: "Build a dashboard", prompt: "Build a dashboard", createdAt: "2026-07-06 06:00:00" }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App apiBaseUrl="https://api.example.com" apiToken="tok" />);

    expect(await screen.findByText("Build a dashboard")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/build/sessions",
      expect.objectContaining({ headers: { Authorization: "Bearer tok" } }),
    );

    vi.unstubAllGlobals();
  });

  it("keeps the sidebar empty (no crash) when the sessions fetch fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network error"));
    vi.stubGlobal("fetch", fetchMock);

    render(<App apiBaseUrl="https://api.example.com" apiToken="tok" />);

    expect(await screen.findByText(/No conversations yet/)).toBeTruthy();

    vi.unstubAllGlobals();
  });

  it("renders LIVE badge and only the Overview nav item when apiBaseUrl is set", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ sessions: [] }) }));
    render(<App apiBaseUrl="https://api.example.com" apiToken="tok" />);
    expect(screen.getByText("LIVE")).toBeTruthy();
    vi.unstubAllGlobals();
  });
});

describe("App — public mode (no apiBaseUrl)", () => {
  it("does not fetch sessions and shows DEMO SIMULATION", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(screen.getByText("DEMO SIMULATION")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
