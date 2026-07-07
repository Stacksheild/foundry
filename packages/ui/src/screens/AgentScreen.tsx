import { tokens as T } from "../tokens";
import { Icon, type IconName } from "../icons";

type FeedType = "Proposal" | "Auto-fix" | "Review";

const TYPE_STYLES: Record<FeedType, { c: string; bg: string; icon: IconName }> = {
  Proposal: { c: T.accent, bg: T.accentBg, icon: "sparkle" },
  "Auto-fix": { c: T.success, bg: T.successBg, icon: "check" },
  Review: { c: T.textSub, bg: T.surface, icon: "eye" },
};

const FEED: { type: FeedType; msg: string; time: string }[] = [
  { type: "Proposal", msg: "proposed a ticket from #analytics-support · 3 mentions of slow dashboard loads", time: "3h ago" },
  { type: "Auto-fix", msg: "opened PR #147 bumping flag-sdk to patch CVE-2026-1183", time: "5h ago" },
  { type: "Review", msg: "reviewed deploy of kpi-performance-tracker: approved, no regressions found", time: "5m ago" },
  { type: "Auto-fix", msg: "rolled back team-productivity-dash to v2.3.8 after health check failure", time: "6h ago" },
  { type: "Proposal", msg: "suggested raising the canary error-rate threshold for feature-flag-dashboard", time: "2h ago" },
  { type: "Review", msg: "reviewed PR #146 on data-sync-worker: requested changes (missing test)", time: "1d ago" },
];

export const AgentScreen = () => (
  <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="sparkle" size={15} color={T.accent} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Foundry Agent</h1>
    </div>
    <p style={{ color: T.textSub, fontSize: 13.5, marginTop: 3, marginBottom: 22, marginLeft: 40 }}>
      Autonomous review, triage, and remediation across your applications
    </p>

    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
      {FEED.map((f, i) => {
        const s = TYPE_STYLES[f.type];
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 20px",
              borderBottom: i < FEED.length - 1 ? `1px solid ${T.border}` : "none",
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={s.icon} size={13} color={s.c} />
            </div>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                background: s.bg,
                color: s.c,
                flexShrink: 0,
              }}
            >
              {f.type}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: T.textMid }}>Foundry Agent {f.msg}</span>
            <span style={{ fontSize: 12, color: T.textFaint, flexShrink: 0 }}>{f.time}</span>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                style={{
                  padding: "4px 10px",
                  background: "transparent",
                  color: T.textSub,
                  border: `1px solid ${T.border}`,
                  borderRadius: 5,
                  fontSize: 11.5,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Approve
              </button>
              <button
                style={{
                  padding: "4px 10px",
                  background: "transparent",
                  color: T.textFaint,
                  border: `1px solid ${T.border}`,
                  borderRadius: 5,
                  fontSize: 11.5,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>

    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 20px" }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Agent settings</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
        <div>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>Auto-approve minor fixes</div>
          <div style={{ fontSize: 12, color: T.textFaint, marginTop: 2 }}>Dependency patches and lint fixes merge without review</div>
        </div>
        <div style={{ width: 36, height: 20, borderRadius: 10, background: T.accent, position: "relative", flexShrink: 0 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, right: 2 }} />
        </div>
      </div>
    </div>
  </div>
);
