import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { LogsScreen } from "../screens/LogsScreen";
import { AnalyticsScreen } from "../screens/AnalyticsScreen";
import { ObservabilityScreen } from "../screens/ObservabilityScreen";
import { EnvVarsScreen } from "../screens/EnvVarsScreen";
import { DomainsScreen } from "../screens/DomainsScreen";
import { IntegrationsScreen } from "../screens/IntegrationsScreen";
import { AgentScreen } from "../screens/AgentScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

// This project's vitest config does not enable `test.globals`, so
// @testing-library/react's implicit afterEach-cleanup auto-registration
// (which checks for a global `afterEach`) never fires. Multiple renders of
// the same screen within this file would otherwise leak DOM nodes across
// tests, so clean up explicitly.
afterEach(() => {
  cleanup();
});

describe("LogsScreen", () => {
  it("renders the log tail with the feature-flag-dashboard P95 spike and the rollback tie-in", () => {
    render(<LogsScreen />);
    expect(screen.getByText("P95 latency spike detected (320ms)")).toBeTruthy();
    expect(screen.getByText("health check failed: /readyz returned 503")).toBeTruthy();
  });
});

describe("AnalyticsScreen", () => {
  it("renders usage stats and the per-application usage bars", () => {
    render(<AnalyticsScreen />);
    expect(screen.getByText("Monthly active builders")).toBeTruthy();
    expect(screen.getByText("Usage by application")).toBeTruthy();
  });
});

describe("ObservabilityScreen", () => {
  it("renders the service health matrix and recent incidents", () => {
    render(<ObservabilityScreen />);
    expect(screen.getByText("320ms")).toBeTruthy();
    expect(screen.getByText("Recent Incidents")).toBeTruthy();
  });
});

describe("EnvVarsScreen", () => {
  it("renders masked env var rows with environment badges", () => {
    render(<EnvVarsScreen />);
    expect(screen.getByText("DATABASE_URL")).toBeTruthy();
    expect(screen.getAllByText("••••••••").length).toBeGreaterThan(0);
  });
});

describe("DomainsScreen", () => {
  it("renders domain rows including the pending verification story", () => {
    render(<DomainsScreen />);
    expect(screen.getByText("kpi.internal.acme.dev")).toBeTruthy();
    expect(screen.getByText("Pending verification")).toBeTruthy();
  });
});

describe("IntegrationsScreen", () => {
  it("renders integration cards with connected and available states", () => {
    render(<IntegrationsScreen />);
    expect(screen.getByText("Slack")).toBeTruthy();
    expect(screen.getByText("Snowflake")).toBeTruthy();
    expect(screen.getAllByText("Connected").length).toBe(4);
  });
});

describe("AgentScreen", () => {
  it("renders the Foundry Agent activity feed and settings card", () => {
    render(<AgentScreen />);
    expect(screen.getByText("Foundry Agent")).toBeTruthy();
    expect(screen.getByText("Agent settings")).toBeTruthy();
  });
});

describe("SettingsScreen", () => {
  it("renders workspace general info, members, and the danger zone", () => {
    render(<SettingsScreen />);
    expect(screen.getAllByText("my-workspace").length).toBeGreaterThan(0);
    expect(screen.getByText("us-west-2")).toBeTruthy();
    expect(screen.getByText("Danger zone")).toBeTruthy();
  });
});
