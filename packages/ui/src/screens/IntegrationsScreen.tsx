import { tokens as T } from "../tokens";
import { Icon, type IconName } from "../icons";

interface Integration {
  name: string;
  desc: string;
  icon: IconName;
  connected: boolean;
}

const INTEGRATIONS: Integration[] = [
  { name: "Slack", desc: "Deploy and incident notifications in #kpi-tracker-deploys", icon: "send", connected: true },
  { name: "GitHub", desc: "PR checks, branch deploys, and agent-opened pull requests", icon: "code", connected: true },
  { name: "PagerDuty", desc: "Escalate production incidents to the on-call rotation", icon: "warn", connected: true },
  { name: "Datadog", desc: "Mirror service health metrics into existing dashboards", icon: "chart", connected: true },
  { name: "Jira", desc: "Sync tickets proposed by the Foundry Agent", icon: "layers", connected: false },
  { name: "Snowflake", desc: "Export analytics events to your data warehouse", icon: "grid", connected: false },
];

export const IntegrationsScreen = () => (
  <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 4 }}>
        Foundry / <span style={{ color: T.accent }}>my-workspace</span>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Integrations</h1>
      <p style={{ color: T.textSub, fontSize: 13.5, marginTop: 3 }}>Connect Foundry to the rest of your stack</p>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
      {INTEGRATIONS.map((it) => (
        <div key={it.name} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={it.icon} size={16} color={T.accent} />
            </div>
            <span
              style={{
                padding: "3px 9px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                background: it.connected ? T.successBg : T.surface,
                color: it.connected ? T.success : T.textSub,
                border: it.connected ? "none" : `1px solid ${T.border}`,
              }}
            >
              {it.connected ? "Connected" : "Available"}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{it.name}</div>
          <p style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.45, minHeight: 34 }}>{it.desc}</p>
          {!it.connected && (
            <button
              style={{
                marginTop: 8,
                padding: "6px 14px",
                background: T.accentBg,
                color: T.accent,
                border: "none",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Connect
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);
