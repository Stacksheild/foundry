import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AppNav } from "../components/AppNav";
import { Header } from "../components/Header";

// This project's vitest config does not enable `test.globals`, so
// @testing-library/react's implicit afterEach-cleanup auto-registration
// (which checks for a global `afterEach`) never fires. Multiple renders of
// the same screen within this file would otherwise leak DOM nodes across
// tests, so clean up explicitly.
afterEach(() => {
  cleanup();
});

describe("AppNav", () => {
  it("renders all ten items when live is not set", () => {
    render(<AppNav active="overview" setActive={vi.fn()} setScreen={vi.fn()} />);
    expect(screen.getByText("Overview")).toBeTruthy();
    expect(screen.getByText("Deployments")).toBeTruthy();
    expect(screen.getByText("Logs")).toBeTruthy();
    expect(screen.getByText("Analytics")).toBeTruthy();
    expect(screen.getByText("Observability")).toBeTruthy();
    expect(screen.getByText("Environment Vars")).toBeTruthy();
    expect(screen.getByText("Domains")).toBeTruthy();
    expect(screen.getByText("Integrations")).toBeTruthy();
    expect(screen.getByText("Agent")).toBeTruthy();
    expect(screen.getByText("Settings")).toBeTruthy();
  });

  it("renders only Overview when live is true", () => {
    render(<AppNav active="overview" setActive={vi.fn()} setScreen={vi.fn()} live />);
    expect(screen.getByText("Overview")).toBeTruthy();
    expect(screen.queryByText("Deployments")).toBeNull();
    expect(screen.queryByText("Logs")).toBeNull();
    expect(screen.queryByText("Analytics")).toBeNull();
    expect(screen.queryByText("Observability")).toBeNull();
    expect(screen.queryByText("Environment Vars")).toBeNull();
    expect(screen.queryByText("Domains")).toBeNull();
    expect(screen.queryByText("Integrations")).toBeNull();
    expect(screen.queryByText("Agent")).toBeNull();
    expect(screen.queryByText("Settings")).toBeNull();
  });
});

describe("Header", () => {
  it("shows DEMO SIMULATION when live is not set", () => {
    render(<Header screen="home" setScreen={vi.fn()} />);
    expect(screen.getByText("DEMO SIMULATION")).toBeTruthy();
    expect(screen.queryByText("LIVE")).toBeNull();
  });

  it("shows LIVE when live is true", () => {
    render(<Header screen="home" setScreen={vi.fn()} live />);
    expect(screen.getByText("LIVE")).toBeTruthy();
    expect(screen.queryByText("DEMO SIMULATION")).toBeNull();
  });
});
