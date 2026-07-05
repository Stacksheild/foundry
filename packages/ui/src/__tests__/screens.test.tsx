import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HomeScreen } from "../screens/HomeScreen";
import { BuildScreen } from "../screens/BuildScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DeployScreen } from "../screens/DeployScreen";

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
  it("renders the applications table", () => {
    render(<DashboardScreen setScreen={vi.fn()} setNavActive={vi.fn()} />);
    expect(screen.getByText("My Applications")).toBeTruthy();
    expect(screen.getByText("team-productivity-dash")).toBeTruthy();
  });
});

describe("DeployScreen", () => {
  it("renders the deployment pipeline and health checks", () => {
    render(<DeployScreen setScreen={vi.fn()} setNavActive={vi.fn()} />);
    expect(screen.getByText("Deployment Pipeline")).toBeTruthy();
    expect(screen.getByText("Health Checks")).toBeTruthy();
  });
});
