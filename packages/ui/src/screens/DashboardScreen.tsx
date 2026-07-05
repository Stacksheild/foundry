import { tokens as T } from "../tokens";
import { Icon } from "../icons";
import { StatusBadge } from "../components/StatusBadge";
import { APPS_DATA } from "../data/apps";
import type { ScreenId } from "../types";

export const DashboardScreen = ({
  setScreen,
  setNavActive,
}: {
  setScreen: (s: ScreenId) => void;
  setNavActive: (id: string) => void;
}) => (
  <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
      <div>
        <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 4 }}>
          Foundry / <span style={{ color: T.accent }}>my-workspace</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Applications</h1>
        <p style={{ color: T.textSub, fontSize: 13.5, marginTop: 3 }}>6 apps · 4 production · 1 staging · 1 dev</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn-ghost"
          style={{
            padding: "8px 14px",
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            fontSize: 13.5,
            color: T.text,
            background: T.bg,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="refresh" size={13} color={T.textSub} /> Refresh
        </button>
        <button
          onClick={() => setScreen("home")}
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
          <Icon name="plus" size={13} color="#fff" /> New App
        </button>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
      {[
        { l: "Deploy Frequency", v: "4.2 / day", d: "+12%", i: "deploy" as const },
        { l: "Avg Lead Time", v: "3.1 hrs", d: "−18%", i: "pulse" as const },
        { l: "Error Rate", v: "1.2%", d: "−0.4%", i: "warn" as const },
        { l: "Apps Healthy", v: "5 / 6", d: "83%", i: "check" as const },
      ].map((m, i) => (
        <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 11.5, color: T.textFaint, marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name={m.i} size={12} color={T.textFaint} /> {m.l}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{m.v}</div>
          <div style={{ fontSize: 11.5, color: T.success, marginTop: 4 }}>{m.d} vs last week</div>
        </div>
      ))}
    </div>

    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 110px 100px 120px 1fr 130px",
          padding: "10px 20px",
          borderBottom: `1px solid ${T.border}`,
          fontSize: 11.5,
          fontWeight: 700,
          color: T.textFaint,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        <span>Application</span>
        <span>Status</span>
        <span>Env</span>
        <span>Last Deploy</span>
        <span>URL</span>
        <span></span>
      </div>
      {APPS_DATA.map((app, i) => (
        <div
          key={app.id}
          className="row-hover"
          style={{
            display: "grid",
            gridTemplateColumns: "1.8fr 110px 100px 120px 1fr 130px",
            padding: "12px 20px",
            borderBottom: i < APPS_DATA.length - 1 ? `1px solid ${T.border}` : "none",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, fontFamily: "monospace", color: T.text }}>{app.name}</div>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 1 }}>
              v{app.ver} · {app.team}
            </div>
          </div>
          <StatusBadge status={app.status} />
          <span
            style={{
              padding: "3px 9px",
              borderRadius: 12,
              background: T.surface,
              border: `1px solid ${T.border}`,
              fontSize: 11.5,
              color: T.textSub,
              fontWeight: 500,
            }}
          >
            {app.env}
          </span>
          <span style={{ fontSize: 12.5, color: T.textSub }}>{app.deploy}</span>
          <span
            style={{
              fontSize: 12,
              color: T.accent,
              fontFamily: "monospace",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {app.name.substring(0, 12)}.foundry.app
          </span>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                setScreen("deploy");
                setNavActive("deployments");
              }}
              style={{
                padding: "5px 12px",
                background: T.accentBg,
                color: T.accent,
                border: "none",
                borderRadius: 5,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Deploy
            </button>
            <button
              style={{
                padding: "5px 9px",
                background: T.surface,
                color: T.textSub,
                border: `1px solid ${T.border}`,
                borderRadius: 5,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <Icon name="dots" size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>

    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recent Activity</h2>
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
      {[
        { icon: "deploy" as const, msg: "customer-escalation-intel deployed to production", time: "1h ago", type: "success" as const },
        { icon: "deploy" as const, msg: "kpi-performance-tracker promotion: staging → production (in progress)", time: "5m ago", type: "active" as const },
        { icon: "warn" as const, msg: "feature-flag-dashboard · P95 latency spike detected (320ms)", time: "2h ago", type: "warn" as const },
        { icon: "deploy" as const, msg: "team-productivity-dash auto-rolled back v2.3.9 (health check failed)", time: "6h ago", type: "danger" as const },
        { icon: "sparkle" as const, msg: "Foundry Agent proposed a ticket from #analytics-support · 3 mentions", time: "3h ago", type: "info" as const },
      ].map((ev, i) => {
        const color = ev.type === "success" ? T.success : ev.type === "warn" ? T.warning : ev.type === "danger" ? T.danger : T.accent;
        const bg = ev.type === "success" ? T.successBg : ev.type === "warn" ? T.warningBg : ev.type === "danger" ? T.dangerBg : T.accentBg;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
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
