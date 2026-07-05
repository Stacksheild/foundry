import type { AppRecord } from "../types";

export const APPS_DATA: AppRecord[] = [
  { id: 1, name: "team-productivity-dash", env: "production", status: "healthy", deploy: "2m ago", team: "Analytics", ver: "2.4.1" },
  { id: 2, name: "customer-escalation-intel", env: "production", status: "healthy", deploy: "1h ago", team: "Analytics", ver: "1.2.0" },
  { id: 3, name: "kpi-performance-tracker", env: "staging", status: "deploying", deploy: "5m ago", team: "Analytics", ver: "0.9.3" },
  { id: 4, name: "feature-flag-dashboard", env: "production", status: "warning", deploy: "3h ago", team: "Product", ver: "3.1.2" },
  { id: 5, name: "incident-intelligence", env: "production", status: "healthy", deploy: "30m ago", team: "Operations", ver: "1.5.0" },
  { id: 6, name: "golden-path-wizard", env: "dev", status: "healthy", deploy: "10m ago", team: "Engineering", ver: "0.1.0" },
];
