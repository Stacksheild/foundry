import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
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
    render(<BuildScreen session={null} onPromote={vi.fn()} />);
    expect(screen.getByText("Build a team productivity dashboard")).toBeTruthy();
  });

  it("wires Promote to Staging to the deployment-progress flow once the build finishes", async () => {
    const onPromote = vi.fn();
    render(<BuildScreen session={null} onPromote={onPromote} />);

    const promote = await screen.findByRole("button", { name: /Promote to Staging/ }, { timeout: 8000 });
    fireEvent.click(promote);
    expect(onPromote).toHaveBeenCalledTimes(1);
  });

  it("switches the preview panel to the Code tab when Edit in IDE is clicked", async () => {
    render(<BuildScreen session={null} onPromote={vi.fn()} />);

    const edit = await screen.findByRole("button", { name: "Edit in IDE" }, { timeout: 8000 });
    fireEvent.click(edit);
    expect(await screen.findByText("src/screens/TeamProductivityDash.tsx")).toBeTruthy();
  });

  it("shows dev logs when the Logs preview tab is clicked", async () => {
    render(<BuildScreen session={null} onPromote={vi.fn()} />);

    await screen.findByRole("button", { name: /Promote to Staging/ }, { timeout: 8000 });
    fireEvent.click(screen.getByText("Logs"));
    expect(await screen.findByText(/deployed to dev — health check/)).toBeTruthy();
  });

  it("copies a share link and confirms on the Share button", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    render(<BuildScreen session={null} onPromote={vi.fn()} />);

    const share = await screen.findByRole("button", { name: "Share" }, { timeout: 8000 });
    fireEvent.click(share);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("button", { name: /Link copied/ })).toBeTruthy();

    vi.unstubAllGlobals();
  });
});

function makeStreamResponse(chunks: string[], sessionId: number) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok: true,
    status: 200,
    headers: { get: (name: string) => (name === "x-foundry-session-id" ? String(sessionId) : null) },
    body: {
      getReader: () => ({
        read: async () => {
          if (i < chunks.length) {
            const value = encoder.encode(chunks[i]);
            i++;
            return { value, done: false };
          }
          return { value: undefined, done: true };
        },
      }),
    },
  };
}

describe("BuildScreen — live mode (apiBaseUrl set)", () => {
  it("sends the POST with a bearer header and renders streamed chunks progressively", async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse(["Hel", "lo"], 42));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BuildScreen session={null} onPromote={vi.fn()} apiBaseUrl="https://api.example.com" apiToken="tok" />,
    );

    fireEvent.change(screen.getByPlaceholderText("Ask the Foundry agent…"), {
      target: { value: "Build a dashboard" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Hello")).toBeTruthy();
    expect(screen.getByText("Build a dashboard")).toBeTruthy();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/build/chat",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer tok", "content-type": "application/json" }),
        body: JSON.stringify({ messages: [{ role: "user", content: "Build a dashboard" }], sessionId: undefined }),
      }),
    );

    vi.unstubAllGlobals();
  });

  it("shows an inline error bubble when the chat request fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network error"));
    vi.stubGlobal("fetch", fetchMock);

    render(<BuildScreen session={null} onPromote={vi.fn()} apiBaseUrl="https://api.example.com" apiToken="tok" />);

    fireEvent.change(screen.getByPlaceholderText("Ask the Foundry agent…"), {
      target: { value: "Build a dashboard" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/Couldn.t reach the Foundry agent/)).toBeTruthy();

    vi.unstubAllGlobals();
  });

  it("does not render the scripted narration or the Promote/IDE/Share buttons", async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse(["Hi"], 1));
    vi.stubGlobal("fetch", fetchMock);

    render(<BuildScreen session={null} onPromote={vi.fn()} apiBaseUrl="https://api.example.com" apiToken="tok" />);

    expect(screen.queryByRole("button", { name: /Promote to Staging/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit in IDE" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
    expect(screen.queryByText("Reading codebase context & service catalog")).toBeNull();
    expect(screen.queryByText("Team Productivity Insights")).toBeNull();

    vi.unstubAllGlobals();
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

  it("does not flash mock apps, metrics, or activity in live mode before the fetch resolves", async () => {
    let resolveFetch: (v: unknown) => void = () => {};
    const fetchMock = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardScreen setScreen={vi.fn()} setNavActive={vi.fn()} apiBaseUrl="https://api.example.com" />);

    // Mock app rows and mock activity feed must never appear in live mode.
    expect(screen.queryByText("team-productivity-dash")).toBeNull();
    expect(screen.queryByText("customer-escalation-intel deployed to production")).toBeNull();
    expect(screen.queryByText("Recent Activity")).toBeNull();
    expect(screen.queryByText("Deploy Frequency")).toBeNull();
    expect(screen.queryByText("Apps Healthy")).toBeNull();
    expect(screen.getByText(/Loading applications/)).toBeTruthy();

    resolveFetch({ ok: true, json: async () => ({ apps: [] }) });
    await screen.findByText("0 apps · 0 production · 0 staging · 0 dev");

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

  it("shows an error banner (not the mock list) when the initial fetch fails in live mode", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network error"));
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardScreen setScreen={vi.fn()} setNavActive={vi.fn()} apiBaseUrl="https://api.example.com" />);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/apps", expect.anything()),
    );

    // A failed initial fetch must never fall back to the mocked demo data —
    // it should surface an explicit error instead.
    expect(await screen.findByText(/Couldn.t reach the Foundry API/)).toBeTruthy();
    expect(screen.queryByText("team-productivity-dash")).toBeNull();
    expect(screen.queryByText("6 apps · 4 production · 1 staging · 1 dev")).toBeNull();

    vi.unstubAllGlobals();
  });

  it("clears the error banner and shows real data after a successful refresh", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network error"))
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
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardScreen setScreen={vi.fn()} setNavActive={vi.fn()} apiBaseUrl="https://api.example.com" />);

    expect(await screen.findByText(/Couldn.t reach the Foundry API/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(await screen.findByText("live-app")).toBeTruthy();
    expect(screen.queryByText(/Couldn.t reach the Foundry API/)).toBeNull();

    vi.unstubAllGlobals();
  });

  it("marks the row as error when the deploy request fails", async () => {
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
      .mockRejectedValueOnce(new Error("deploy failed"));
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardScreen setScreen={vi.fn()} setNavActive={vi.fn()} apiBaseUrl="https://api.example.com" />);
    await screen.findByText("live-app");

    fireEvent.click(screen.getByRole("button", { name: "Deploy" }));

    expect(await screen.findByText("Error")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/apps/live-app/deploy",
      expect.objectContaining({ method: "POST" }),
    );

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
