import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { HomeScreen } from "../screens/HomeScreen";
import { BuildScreen } from "../screens/BuildScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DeployScreen } from "../screens/DeployScreen";

// This project's vitest config does not enable `test.globals`, so
// @testing-library/react's implicit afterEach-cleanup auto-registration
// (which checks for a global `afterEach`) never fires. Multiple renders of
// the same screen within this file would otherwise leak DOM nodes across
// tests, so clean up explicitly.
afterEach(() => {
  cleanup();
});

describe("HomeScreen", () => {
  it("renders the hero and calls onSubmit when a suggestion card is clicked", () => {
    const onSubmit = vi.fn();
    render(<HomeScreen onSubmit={onSubmit} />);

    expect(screen.getByRole("heading", { name: "Foundry" })).toBeTruthy();

    const suggestion = screen.getByText("On-call & field service app");
    fireEvent.click(suggestion);
    expect(onSubmit).toHaveBeenCalledWith("On-call & field service app");
  });
});

describe("BuildScreen", () => {
  it("renders the chat panel with the default prompt when no session is given", () => {
    render(<BuildScreen session={null} onNavigateDash={vi.fn()} />);
    expect(screen.getByText("Build a team productivity dashboard")).toBeTruthy();
  });
});

describe("DashboardScreen", () => {
  it("renders the mocked applications table when apiBaseUrl is not set", () => {
    render(<DashboardScreen setScreen={vi.fn()} setNavActive={vi.fn()} />);
    expect(screen.getByText("My Applications")).toBeTruthy();
    expect(screen.getByText("team-productivity-dash")).toBeTruthy();
    expect(screen.getByText("6 apps · 4 production · 1 staging · 1 dev")).toBeTruthy();
  });

  it("fetches and renders real apps when apiBaseUrl is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        apps: [
          {
            id: 1,
            name: "live-app",
            env: "dev",
            status: "healthy",
            version: "0.2.0",
            team: "Platform",
            url: "https://live-app.exe.xyz",
            vmName: "live-app",
            createdAt: "2026-07-06 06:00:00",
            updatedAt: "2026-07-06 06:00:00",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardScreen setScreen={vi.fn()} setNavActive={vi.fn()} apiBaseUrl="https://api.example.com" apiToken="tok" />);

    expect(await screen.findByText("live-app")).toBeTruthy();
    expect(screen.getByText("https://live-app.exe.xyz")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/apps",
      expect.objectContaining({ headers: { Authorization: "Bearer tok" } }),
    );

    vi.unstubAllGlobals();
  });

  it("calls the real deploy endpoint and updates the row on click", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          apps: [
            {
              id: 1,
              name: "live-app",
              env: "dev",
              status: "healthy",
              version: "0.2.0",
              team: "Platform",
              url: null,
              vmName: null,
              createdAt: "2026-07-06 06:00:00",
              updatedAt: "2026-07-06 06:00:00",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: "live-app",
          env: "dev",
          status: "healthy",
          version: "0.2.0",
          team: "Platform",
          url: "https://live-app.exe.xyz",
          vmName: "live-app",
          createdAt: "2026-07-06 06:00:00",
          updatedAt: "2026-07-06 06:05:00",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardScreen setScreen={vi.fn()} setNavActive={vi.fn()} apiBaseUrl="https://api.example.com" />);
    await screen.findByText("live-app");

    fireEvent.click(screen.getByRole("button", { name: "Deploy" }));

    expect(await screen.findByText("https://live-app.exe.xyz")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/apps/live-app/deploy", expect.objectContaining({ method: "POST" }));

    vi.unstubAllGlobals();
  });
});

describe("DeployScreen", () => {
  it("renders the deployment pipeline and health checks", () => {
    render(<DeployScreen setScreen={vi.fn()} setNavActive={vi.fn()} />);
    expect(screen.getByText("Deployment Pipeline")).toBeTruthy();
    expect(screen.getByText("Health Checks")).toBeTruthy();
  });
});
