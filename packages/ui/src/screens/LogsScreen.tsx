import { tokens as T } from "../tokens";
import { Icon } from "../icons";

type Level = "INFO" | "WARN" | "ERROR";

const LEVEL_STYLES: Record<Level, { c: string; bg: string }> = {
  INFO: { c: T.textSub, bg: T.surface },
  WARN: { c: T.warning, bg: T.warningBg },
  ERROR: { c: T.danger, bg: T.dangerBg },
};

const LOG_ROWS: { t: string; level: Level; service: string; msg: string }[] = [
  { t: "14:02:11.204", level: "INFO", service: "kpi-performance-tracker", msg: "canary traffic increased to 42%" },
  { t: "14:01:58.812", level: "INFO", service: "customer-escalation-intel", msg: "request completed in 84ms" },
  { t: "14:01:40.331", level: "WARN", service: "feature-flag-dashboard", msg: "P95 latency spike detected (320ms)" },
  { t: "14:01:22.019", level: "INFO", service: "data-sync-worker", msg: "sync batch #4821 completed, 1,204 rows" },
  { t: "14:00:59.775", level: "ERROR", service: "team-productivity-dash", msg: "health check failed: /readyz returned 503" },
  { t: "14:00:59.771", level: "INFO", service: "team-productivity-dash", msg: "auto-rolled back v2.3.9 → v2.3.8" },
  { t: "14:00:41.556", level: "INFO", service: "deploy-preview-svc", msg: "preview environment pr-142 provisioned" },
  { t: "14:00:12.098", level: "INFO", service: "kpi-performance-tracker", msg: "GET /api/metrics 200 12ms" },
  { t: "13:59:47.402", level: "WARN", service: "feature-flag-dashboard", msg: "connection pool at 88% capacity" },
  { t: "13:59:30.220", level: "INFO", service: "data-sync-worker", msg: "starting sync batch #4822" },
  { t: "13:59:03.114", level: "INFO", service: "customer-escalation-intel", msg: "cache warmed for tenant acme-co" },
  { t: "13:58:44.887", level: "ERROR", service: "deploy-preview-svc", msg: "build step 'lint' exited with code 1 (retrying)" },
];

const FILTERS = ["All", "Errors", "Warnings", "Info"];
const APP_FILTER = ["All apps", "team-productivity-dash", "kpi-performance-tracker", "feature-flag-dashboard"];

export const LogsScreen = () => (
  <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 4 }}>
        Foundry / <span style={{ color: T.accent }}>my-workspace</span>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Logs</h1>
      <p style={{ color: T.textSub, fontSize: 13.5, marginTop: 3 }}>Live tail across all applications</p>
    </div>

    <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 6 }}>
        {FILTERS.map((f, i) => (
          <span
            key={f}
            style={{
              padding: "5px 12px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              background: i === 0 ? T.accentBg : T.surface,
              color: i === 0 ? T.accent : T.textSub,
              border: `1px solid ${i === 0 ? T.accentBorder : T.border}`,
            }}
          >
            {f}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {APP_FILTER.map((f, i) => (
          <span
            key={f}
            style={{
              padding: "5px 12px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              background: i === 0 ? T.accentBg : T.surface,
              color: i === 0 ? T.accent : T.textSub,
              border: `1px solid ${i === 0 ? T.accentBorder : T.border}`,
            }}
          >
            {f}
          </span>
        ))}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textFaint }}>
        <Icon name="pulse" size={12} color={T.success} /> Streaming
      </div>
    </div>

    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "150px 70px 220px 1fr",
          padding: "10px 20px",
          borderBottom: `1px solid ${T.border}`,
          fontSize: 11.5,
          fontWeight: 700,
          color: T.textFaint,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        <span>Time</span>
        <span>Level</span>
        <span>Service</span>
        <span>Message</span>
      </div>
      {LOG_ROWS.map((row, i) => {
        const s = LEVEL_STYLES[row.level];
        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "150px 70px 220px 1fr",
              padding: "8px 20px",
              borderBottom: i < LOG_ROWS.length - 1 ? `1px solid ${T.border}` : "none",
              alignItems: "center",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            <span style={{ color: T.textFaint }}>{row.t}</span>
            <span>
              <span
                style={{
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: s.bg,
                  color: s.c,
                  fontWeight: 700,
                  fontSize: 10.5,
                }}
              >
                {row.level}
              </span>
            </span>
            <span style={{ color: T.textSub }}>{row.service}</span>
            <span style={{ color: T.text }}>{row.msg}</span>
          </div>
        );
      })}
    </div>
  </div>
);
