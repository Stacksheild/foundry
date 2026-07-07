import { tokens as T } from "../tokens";
import { Icon } from "../icons";

const DOMAINS: { domain: string; target: string; ssl: "Active"; dns: "Verified" | "Pending verification"; added: string }[] = [
  { domain: "kpi.internal.acme.dev", target: "kpi-performance-tracker", ssl: "Active", dns: "Verified", added: "48d ago" },
  { domain: "escalations.acme.dev", target: "customer-escalation-intel", ssl: "Active", dns: "Verified", added: "62d ago" },
  { domain: "flags.acme.dev", target: "feature-flag-dashboard", ssl: "Active", dns: "Verified", added: "31d ago" },
  { domain: "team-dash.acme.dev", target: "team-productivity-dash", ssl: "Active", dns: "Verified", added: "90d ago" },
  { domain: "preview.acme.dev", target: "deploy-preview-svc", ssl: "Active", dns: "Pending verification", added: "2h ago" },
];

export const DomainsScreen = () => (
  <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
      <div>
        <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 4 }}>
          Foundry / <span style={{ color: T.accent }}>my-workspace</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Domains</h1>
        <p style={{ color: T.textSub, fontSize: 13.5, marginTop: 3 }}>{DOMAINS.length} custom domains across your applications</p>
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
        <Icon name="plus" size={13} color="#fff" /> Add Domain
      </button>
    </div>

    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1.4fr 90px 190px 100px",
          padding: "10px 20px",
          borderBottom: `1px solid ${T.border}`,
          fontSize: 11.5,
          fontWeight: 700,
          color: T.textFaint,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        <span>Domain</span>
        <span>Target app</span>
        <span>SSL</span>
        <span>DNS</span>
        <span>Added</span>
      </div>
      {DOMAINS.map((d, i) => {
        const pending = d.dns === "Pending verification";
        return (
          <div
            key={d.domain}
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1.4fr 90px 190px 100px",
              padding: "12px 20px",
              borderBottom: i < DOMAINS.length - 1 ? `1px solid ${T.border}` : "none",
              alignItems: "center",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "monospace", fontWeight: 600, fontSize: 13, color: T.text }}>
              <Icon name="domain" size={12} color={T.textFaint} />
              {d.domain}
            </span>
            <span style={{ fontFamily: "monospace", fontSize: 12.5, color: T.textSub }}>{d.target}</span>
            <span
              style={{
                padding: "3px 9px",
                borderRadius: 12,
                background: T.successBg,
                color: T.success,
                fontSize: 11.5,
                fontWeight: 600,
                width: "fit-content",
              }}
            >
              {d.ssl}
            </span>
            <span
              style={{
                padding: "3px 9px",
                borderRadius: 12,
                background: pending ? T.warningBg : T.successBg,
                color: pending ? T.warning : T.success,
                fontSize: 11.5,
                fontWeight: 600,
                width: "fit-content",
              }}
            >
              {d.dns}
            </span>
            <span style={{ fontSize: 12, color: T.textFaint }}>{d.added}</span>
          </div>
        );
      })}
    </div>
  </div>
);
