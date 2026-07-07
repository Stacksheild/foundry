import { tokens as T } from "../tokens";
import { Icon } from "../icons";

interface SvcHealth {
  name: string;
  uptime: string;
  p50: string;
  p95: string;
  p95Warn?: boolean;
  p99: string;
  errRate: string;
  budget: number;
}

const HEALTH: SvcHealth[] = [
  { name: "team-productivity-dash", uptime: "99.98%", p50: "22ms", p95: "68ms", p99: "140ms", errRate: "0.1%", budget: 92 },
  { name: "customer-escalation-intel", uptime: "99.95%", p50: "31ms", p95: "80ms", p99: "160ms", errRate: "0.2%", budget: 88 },
  { name: "kpi-performance-tracker", uptime: "99.90%", p50: "28ms", p95: "87ms", p99: "180ms", errRate: "0.3%", budget: 74 },
  { name: "feature-flag-dashboard", uptime: "99.62%", p50: "45ms", p95: "320ms", p95Warn: true, p99: "540ms", errRate: "1.4%", budget: 31 },
  { name: "deploy-preview-svc", uptime: "99.99%", p50: "18ms", p95: "52ms", p99: "95ms", errRate: "0.0%", budget: 97 },
  { name: "data-sync-worker", uptime: "99.87%", p50: "60ms", p95: "140ms", p99: "310ms", errRate: "0.4%", budget: 69 },
];

const INCIDENTS = [
  { icon: "deploy" as const, msg: "team-productivity-dash auto-rolled back v2.3.9 (health check failed)", time: "6h ago", type: "danger" as const },
  { icon: "warn" as const, msg: "feature-flag-dashboard · P95 latency spike investigation opened (320ms)", time: "2h ago", type: "warn" as const },
  { icon: "check" as const, msg: "data-sync-worker error budget recovered above 65% threshold", time: "9h ago", type: "success" as const },
  { icon: "deploy" as const, msg: "kpi-performance-tracker promotion: staging → production (in progress)", time: "5m ago", type: "active" as const },
];

export const ObservabilityScreen = () => (
  <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 4 }}>
        Foundry / <span style={{ color: T.accent }}>my-workspace</span>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Observability</h1>
      <p style={{ color: T.textSub, fontSize: 13.5, marginTop: 3 }}>Service health across your workspace</p>
    </div>

    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 90px 80px 80px 80px 100px",
          padding: "10px 20px",
          borderBottom: `1px solid ${T.border}`,
          fontSize: 11.5,
          fontWeight: 700,
          color: T.textFaint,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        <span>Service</span>
        <span>Uptime</span>
        <span>P50</span>
        <span>P95</span>
        <span>P99</span>
        <span>Error rate</span>
      </div>
      {HEALTH.map((s, i) => (
        <div
          key={s.name}
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 90px 80px 80px 80px 100px",
            padding: "10px 20px",
            borderBottom: i < HEALTH.length - 1 ? `1px solid ${T.border}` : "none",
            alignItems: "center",
            fontSize: 12.5,
          }}
        >
          <span style={{ fontFamily: "monospace", fontWeight: 600, color: T.text }}>{s.name}</span>
          <span style={{ color: T.textSub }}>{s.uptime}</span>
          <span style={{ color: T.textSub, fontFamily: "monospace" }}>{s.p50}</span>
          <span style={{ color: s.p95Warn ? T.warning : T.textSub, fontFamily: "monospace", fontWeight: s.p95Warn ? 700 : 400 }}>
            {s.p95}
          </span>
          <span style={{ color: T.textSub, fontFamily: "monospace" }}>{s.p99}</span>
          <span style={{ color: T.textSub, fontFamily: "monospace" }}>{s.errRate}</span>
        </div>
      ))}
    </div>

    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Error budget remaining</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {HEALTH.map((s) => {
          const color = s.budget < 40 ? T.danger : s.budget < 75 ? T.warning : T.success;
          return (
            <div key={s.name}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                <span style={{ fontFamily: "monospace", color: T.text }}>{s.name}</span>
                <span style={{ color, fontWeight: 600 }}>{s.budget}%</span>
              </div>
              <div style={{ background: T.surface, borderRadius: 5, height: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
                <div style={{ height: "100%", width: `${s.budget}%`, background: color, borderRadius: 5 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recent Incidents</h2>
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
      {INCIDENTS.map((ev, i) => {
        const color = ev.type === "success" ? T.success : ev.type === "warn" ? T.warning : ev.type === "danger" ? T.danger : T.accent;
        const bg = ev.type === "success" ? T.successBg : ev.type === "warn" ? T.warningBg : ev.type === "danger" ? T.dangerBg : T.accentBg;
        return (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: i < INCIDENTS.length - 1 ? `1px solid ${T.border}` : "none" }}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={ev.icon} size={13} color={color} />
            </div>
            <span style={{ flex: 1, fontSize: 13, color: T.textMid }}>{ev.msg}</span>
            <span style={{ fontSize: 12, color: T.textFaint, flexShrink: 0 }}>{ev.time}</span>
          </div>
        );
      })}
    </div>
  </div>
);
