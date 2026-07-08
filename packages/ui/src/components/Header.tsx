import { tokens as T } from "../tokens";
import { Icon, FoundryLogo } from "../icons";
import type { ScreenId } from "../types";

export const Header = ({
  setScreen,
  live,
}: {
  screen: ScreenId;
  setScreen: (s: ScreenId) => void;
  live?: boolean;
}) => (
  <header
    style={{
      height: 44,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 16px",
      borderBottom: `1px solid ${T.border}`,
      background: T.bg,
      flexShrink: 0,
      zIndex: 50,
    }}
  >
    <button
      onClick={() => setScreen("home")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <FoundryLogo size={24} />
      <span style={{ fontWeight: 700, fontSize: 14.5, color: T.text }}>Foundry</span>
    </button>
    <div style={{ flex: 1 }} />
    <button
      style={
        live
          ? {
              padding: "5px 12px",
              border: `1.5px solid ${T.success}`,
              borderRadius: 5,
              color: T.success,
              background: T.successBg,
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }
          : {
              padding: "5px 12px",
              border: "1.5px solid #C87000",
              borderRadius: 5,
              color: "#9A5800",
              background: "transparent",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }
      }
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: live ? T.success : "#E09000",
          display: "inline-block",
        }}
      />
      {live ? "LIVE" : "DEMO SIMULATION"}
    </button>
    <button
      onClick={() => setScreen("dashboard")}
      style={{
        padding: "5px 13px",
        background: T.accent,
        color: "#fff",
        border: "none",
        borderRadius: 5,
        fontSize: 12.5,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <Icon name="agent" size={13} color="#fff" /> Admin
    </button>
    <div
      style={{
        width: 30,
        height: 30,
        background: T.accent,
        borderRadius: "50%",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      VR
    </div>
  </header>
);
