import { tokens as T } from "../tokens";
import { Icon } from "../icons";

const STATS = [
  { l: "Monthly active builders", v: "128", d: "+9%", i: "grid" as const },
  { l: "API requests (24d)", v: "1.2M", d: "+18%", i: "pulse" as const },
  { l: "Build minutes", v: "3,420", d: "+4%", i: "deploy" as const },
  { l: "Prototypes shipped", v: "47", d: "+22%", i: "sparkle" as const },
];

const USAGE = [
  { name: "team-productivity-dash", pct: 92 },
  { name: "kpi-performance-tracker", pct: 78 },
  { name: "feature-flag-dashboard", pct: 64 },
  { name: "customer-escalation-intel", pct: 51 },
  { name: "deploy-preview-svc", pct: 33 },
  { name: "data-sync-worker", pct: 21 },
];

const BUILDS_PER_DAY = [4, 6, 3, 8, 12, 9, 5, 7, 11, 14, 10, 6, 9, 13];

export const AnalyticsScreen = () => {
  const maxBuilds = Math.max(...BUILDS_PER_DAY);
  return (
    <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 4 }}>
          Foundry / <span style={{ color: T.accent }}>my-workspace</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Analytics</h1>
        <p style={{ color: T.textSub, fontSize: 13.5, marginTop: 3 }}>Usage across your workspace, last 30 days</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {STATS.map((m, i) => (
          <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={m.i} size={12} color={T.textFaint} /> {m.l}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{m.v}</div>
            <div style={{ fontSize: 11.5, color: T.success, marginTop: 4 }}>{m.d} vs last month</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px", marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Usage by application</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {USAGE.map((u) => (
            <div key={u.name}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                <span style={{ fontFamily: "monospace", color: T.text }}>{u.name}</span>
                <span style={{ color: T.textFaint }}>{u.pct}%</span>
              </div>
              <div style={{ background: T.surface, borderRadius: 5, height: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
                <div style={{ height: "100%", width: `${u.pct}%`, background: T.accent, borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Builds per day</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90 }}>
          {BUILDS_PER_DAY.map((v, i) => (
            <div
              key={i}
              title={`${v} builds`}
              style={{
                flex: 1,
                height: `${(v / maxBuilds) * 100}%`,
                background: T.accentBg,
                border: `1px solid ${T.accentBorder}`,
                borderRadius: "3px 3px 0 0",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
