import { useState } from "react";
import { Header } from "./components/Header";
import { SessionSidebar } from "./components/SessionSidebar";
import { AppNav } from "./components/AppNav";
import { HomeScreen } from "./screens/HomeScreen";
import { BuildScreen } from "./screens/BuildScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { DeployScreen } from "./screens/DeployScreen";
import { tokens as T } from "./tokens";
import type { ScreenId, Session } from "./types";

export const App = ({ apiBaseUrl, apiToken }: { apiBaseUrl?: string; apiToken?: string } = {}) => {
  const [screen, setScreen] = useState<ScreenId>("home");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [navActive, setNavActive] = useState("overview");

  const handleSubmit = (prompt: string) => {
    const title = prompt.length > 46 ? prompt.slice(0, 43) + "…" : prompt;
    const s: Session = { id: Date.now(), title, prompt, time: "Just now" };
    setSessions((prev) => [s, ...prev]);
    setCurrent(s.id);
    setScreen("build");
  };

  const session = sessions.find((s) => s.id === current) ?? null;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontSize: 14, color: T.text, background: T.bg }}>
      <Header screen={screen} setScreen={setScreen} />
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
          <AppNav active={navActive} setActive={setNavActive} setScreen={setScreen} />
        )}
        <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {screen === "home" && <HomeScreen onSubmit={handleSubmit} />}
          {screen === "build" && (
            <BuildScreen
              key={current ?? "new"}
              session={session}
              onNavigateDash={() => {
                setScreen("dashboard");
                setNavActive("overview");
              }}
            />
          )}
          {screen === "dashboard" && (
            <DashboardScreen setScreen={setScreen} setNavActive={setNavActive} apiBaseUrl={apiBaseUrl} apiToken={apiToken} />
          )}
          {screen === "deploy" && <DeployScreen setScreen={setScreen} setNavActive={setNavActive} />}
        </main>
      </div>
    </div>
  );
};
