import { tokens as T } from "../tokens";

type Role = "Owner" | "Admin" | "Member";

const ROLE_STYLES: Record<Role, { c: string; bg: string }> = {
  Owner: { c: T.accent, bg: T.accentBg },
  Admin: { c: T.success, bg: T.successBg },
  Member: { c: T.textSub, bg: T.surface },
};

const MEMBERS: { name: string; email: string; role: Role }[] = [
  { name: "Vishal Raina", email: "vishal@acme.dev", role: "Owner" },
  { name: "Priya Anand", email: "priya@acme.dev", role: "Admin" },
  { name: "Marcus Webb", email: "marcus@acme.dev", role: "Member" },
  { name: "Sana Iyer", email: "sana@acme.dev", role: "Member" },
];

const FieldRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 12, color: T.textSub, marginBottom: 6, fontWeight: 500 }}>{label}</div>
    <div
      style={{
        padding: "9px 12px",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        fontSize: 13.5,
        color: T.text,
        fontFamily: label === "Region" ? "monospace" : undefined,
      }}
    >
      {value}
    </div>
  </div>
);

export const SettingsScreen = () => (
  <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 4 }}>
        Foundry / <span style={{ color: T.accent }}>my-workspace</span>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Settings</h1>
      <p style={{ color: T.textSub, fontSize: 13.5, marginTop: 3 }}>Manage your workspace, members, and access</p>
    </div>

    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px", marginBottom: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>General</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <FieldRow label="Workspace name" value="my-workspace" />
        <FieldRow label="Region" value="us-west-2" />
      </div>
    </div>

    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ padding: "13px 18px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14 }}>
        Members
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr 100px",
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
        <span>Email</span>
        <span>Role</span>
      </div>
      {MEMBERS.map((m, i) => (
        <div
          key={m.email}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr 100px",
            padding: "11px 20px",
            borderBottom: i < MEMBERS.length - 1 ? `1px solid ${T.border}` : "none",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{m.name}</span>
          <span style={{ fontSize: 12.5, color: T.textSub }}>{m.email}</span>
          <span
            style={{
              padding: "3px 9px",
              borderRadius: 12,
              background: ROLE_STYLES[m.role].bg,
              color: ROLE_STYLES[m.role].c,
              fontSize: 11.5,
              fontWeight: 600,
              width: "fit-content",
            }}
          >
            {m.role}
          </span>
        </div>
      ))}
    </div>

    <div style={{ background: T.dangerBg, border: `1px solid ${T.danger}`, borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: T.danger, marginBottom: 6 }}>Danger zone</div>
      <p style={{ fontSize: 12.5, color: T.textMid, marginBottom: 12, lineHeight: 1.45 }}>
        Deleting your workspace permanently removes all applications, deployments, and data. This action cannot be undone.
      </p>
      <button
        style={{
          padding: "8px 16px",
          background: T.danger,
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Delete workspace
      </button>
    </div>
  </div>
);
