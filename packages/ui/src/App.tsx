import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { SessionSidebar } from "./components/SessionSidebar";
import { AppNav } from "./components/AppNav";
import { HomeScreen } from "./screens/HomeScreen";
import { BuildScreen } from "./screens/BuildScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { DeployScreen } from "./screens/DeployScreen";
import { LogsScreen } from "./screens/LogsScreen";
import { AnalyticsScreen } from "./screens/AnalyticsScreen";
import { ObservabilityScreen } from "./screens/ObservabilityScreen";
import { EnvVarsScreen } from "./screens/EnvVarsScreen";
import { DomainsScreen } from "./screens/DomainsScreen";
import { IntegrationsScreen } from "./screens/IntegrationsScreen";
import { AgentScreen } from "./screens/AgentScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { tokens as T } from "./tokens";
import { formatRelativeTime } from "./lib/relativeTime";
import type { ScreenId, Session } from "./types";

interface ApiChatSession {
  id: number;
  title: string;
  prompt: string;
  createdAt: string;
}

export const App = ({ apiBaseUrl, apiToken }: { apiBaseUrl?: string; apiToken?: string } = {}) => {
  const [screen, setScreen] = useState<ScreenId>("home");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [navActive, setNavActive] = useState("overview");

  useEffect(() => {
    if (!apiBaseUrl) return;
    const authHeaders = apiToken ? { Authorization: `Bearer ${apiToken}` } : undefined;
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/build/sessions`, { headers: authHeaders });
        const data = (await res.json()) as { sessions: ApiChatSession[] };
        setSessions(
          data.sessions.map((s) => ({
            id: s.id,
            title: s.title,
            prompt: s.prompt,
            time: formatRelativeTime(s.createdAt),
          })),
        );
      } catch {
        // Live mode with no reachable backend: keep an empty sidebar rather
        // than crash or fall back to mock sessions.
      }
    })();
  }, [apiBaseUrl, apiToken]);

  const handleSubmit = (prompt: string) => {
    if (apiBaseUrl) {
      // Live mode: BuildScreen creates the real session on first send and
      // reports it back via onSessionCreated. Just navigate there with the
      // typed prompt as the opening message.
      setCurrent(null);
      setScreen("build");
      return;
    }
    const title = prompt.length > 46 ? prompt.slice(0, 43) + "…" : prompt;
    const s: Session = { id: Date.now(), title, prompt, time: "Just now" };
    setSessions((prev) => [s, ...prev]);
    setCurrent(s.id);
    setScreen("build");
  };

  const handleSessionCreated = (created: { id: number; title: string; prompt: string }) => {
    setSessions((prev) => [{ id: created.id, title: created.title, prompt: created.prompt, time: "just now" }, ...prev]);
    setCurrent(created.id);
  };

  const session = sessions.find((s) => s.id === current) ?? null;

  const renderDashboard = () => {
    switch (navActive) {
      case "logs":
        return <LogsScreen />;
      case "analytics":
        return <AnalyticsScreen />;
      case "observ":
        return <ObservabilityScreen />;
      case "env":
        return <EnvVarsScreen />;
      case "domains":
        return <DomainsScreen />;
      case "integrations":
        return <IntegrationsScreen />;
      case "agent":
        return <AgentScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return <DashboardScreen setScreen={setScreen} setNavActive={setNavActive} apiBaseUrl={apiBaseUrl} apiToken={apiToken} />;
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontSize: 14, color: T.text, background: T.bg }}>
      <Header screen={screen} setScreen={setScreen} live={Boolean(apiBaseUrl)} />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {(screen === "home" || screen === "build") && (
          <SessionSidebar
            sessions={sessions}
            current={current}
            onNew={() => {
              setScreen("home");
              setCurrent(null);
            }}
            onSelect={(id) => {
              setCurrent(id);
              setScreen("build");
            }}
          />
        )}
        {(screen === "dashboard" || screen === "deploy") && (
          <AppNav active={navActive} setActive={setNavActive} setScreen={setScreen} live={Boolean(apiBaseUrl)} />
        )}
        <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {screen === "home" && <HomeScreen onSubmit={handleSubmit} />}
          {screen === "build" && (
            <BuildScreen
              key={current ?? "new"}
              session={session}
              apiBaseUrl={apiBaseUrl}
              apiToken={apiToken}
              onSessionCreated={handleSessionCreated}
              onPromote={() => {
                setScreen("deploy");
                setNavActive("deployments");
              }}
            />
          )}
          {screen === "dashboard" && renderDashboard()}
          {screen === "deploy" && <DeployScreen setScreen={setScreen} setNavActive={setNavActive} />}
        </main>
      </div>
    </div>
  );
};
