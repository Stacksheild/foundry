import { tokens as T } from "../tokens";
import { Icon } from "../icons";

type Env = "Production" | "Staging" | "Dev";

const ENV_BADGE: Record<Env, { c: string; bg: string }> = {
  Production: { c: T.success, bg: T.successBg },
  Staging: { c: T.accent, bg: T.accentBg },
  Dev: { c: T.textSub, bg: T.surface },
};

const VARS: { name: string; envs: Env[]; updated: string }[] = [
  { name: "DATABASE_URL", envs: ["Production", "Staging", "Dev"], updated: "12d ago" },
  { name: "SLACK_WEBHOOK_URL", envs: ["Production", "Staging"], updated: "3d ago" },
  { name: "FF_SDK_KEY", envs: ["Production", "Staging", "Dev"], updated: "3h ago" },
  { name: "ANALYTICS_WRITE_KEY", envs: ["Production"], updated: "21d ago" },
  { name: "PAGERDUTY_ROUTING_KEY", envs: ["Production"], updated: "44d ago" },
  { name: "REDIS_URL", envs: ["Production", "Staging", "Dev"], updated: "12d ago" },
  { name: "SENTRY_DSN", envs: ["Production", "Staging", "Dev"], updated: "60d ago" },
  { name: "AGENT_API_TOKEN", envs: ["Production", "Staging"], updated: "1d ago" },
];

export const EnvVarsScreen = () => (
  <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
      <div>
        <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 4 }}>
          Foundry / <span style={{ color: T.accent }}>my-workspace</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Environment Variables</h1>
        <p style={{ color: T.textSub, fontSize: 13.5, marginTop: 3 }}>{VARS.length} variables shared across your applications</p>
      </div>
      <button
        style={{
          padding: "8px 16px",
          background: T.accent,
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 13.5,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
        }}
      >
        <Icon name="plus" size={13} color="#fff" /> Add Variable
      </button>
    </div>

    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1.6fr 100px",
          padding: "10px 20px",
          borderBottom: `1px solid ${T.border}`,
          fontSize: 11.5,
          fontWeight: 700,
          color: T.textFaint,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        <span>Name</span>
        <span>Value</span>
        <span>Environments</span>
        <span>Updated</span>
      </div>
      {VARS.map((v, i) => (
        <div
          key={v.name}
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1.6fr 100px",
            padding: "12px 20px",
            borderBottom: i < VARS.length - 1 ? `1px solid ${T.border}` : "none",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 13, color: T.text }}>{v.name}</span>
          <span style={{ fontFamily: "monospace", fontSize: 13, color: T.textFaint, letterSpacing: 1 }}>••••••••</span>
          <div style={{ display: "flex", gap: 6 }}>
            {v.envs.map((e) => (
              <span
                key={e}
                style={{
                  padding: "2px 8px",
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 600,
                  background: ENV_BADGE[e].bg,
                  color: ENV_BADGE[e].c,
                }}
              >
                {e}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: T.textFaint }}>{v.updated}</span>
        </div>
      ))}
    </div>
  </div>
);
