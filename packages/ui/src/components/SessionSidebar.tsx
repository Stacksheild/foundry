import { tokens as T } from "../tokens";
import type { Session } from "../types";

export const SessionSidebar = ({
  sessions,
  current,
  onNew,
  onSelect,
}: {
  sessions: Session[];
  current: number | null;
  onNew: () => void;
  onSelect: (id: number) => void;
}) => (
  <aside
    style={{
      width: 200,
      borderRight: `1px solid ${T.border}`,
      display: "flex",
      flexDirection: "column",
      background: T.bg,
      flexShrink: 0,
    }}
  >
    <div
      style={{
        padding: "14px 16px 8px",
        fontSize: 10.5,
        fontWeight: 700,
        color: T.textFaint,
        letterSpacing: 0.9,
        textTransform: "uppercase",
      }}
    >
      Your Sessions
    </div>
    <div style={{ padding: "0 10px 10px" }}>
      <button
        onClick={onNew}
        style={{
          width: "100%",
          padding: "7px 12px",
          borderRadius: 6,
          border: `1px solid ${T.border}`,
          fontSize: 13,
          fontWeight: 500,
          color: T.text,
          background: T.bg,
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <span style={{ color: T.accent, fontWeight: 800, fontSize: 16, lineHeight: 1 }}>+</span>
        New Session
      </button>
    </div>
    <div style={{ flex: 1, overflow: "auto" }}>
      {sessions.length === 0 ? (
        <p style={{ padding: "4px 16px", color: T.textFaint, fontSize: 12.5, lineHeight: 1.6 }}>
          No conversations yet.
          <br />
          Start a new one!
        </p>
      ) : (
        sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{
              width: "100%",
              padding: "9px 16px",
              textAlign: "left",
              border: "none",
              background: current === s.id ? T.accentBg : "transparent",
              borderLeft: `3px solid ${current === s.id ? T.accent : "transparent"}`,
              fontSize: 12.5,
            }}
          >
            <div
              style={{
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: T.text,
              }}
            >
              {s.title}
            </div>
            <div style={{ color: T.textFaint, fontSize: 11, marginTop: 1 }}>{s.time}</div>
          </button>
        ))
      )}
    </div>
  </aside>
);
