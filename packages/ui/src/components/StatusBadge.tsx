import { tokens as T } from "../tokens";
import type { AppStatus } from "../types";

const BADGE_STYLES: Record<AppStatus, { bg: string; c: string; dot: string; lbl: string }> = {
  healthy: { bg: T.successBg, c: T.success, dot: T.success, lbl: "Healthy" },
  deploying: { bg: T.accentBg, c: T.accent, dot: T.accent, lbl: "Deploying" },
  warning: { bg: T.warningBg, c: T.warning, dot: "#C08000", lbl: "Warning" },
  error: { bg: T.dangerBg, c: T.danger, dot: T.danger, lbl: "Error" },
};

export const StatusBadge = ({ status }: { status: AppStatus }) => {
  const m = BADGE_STYLES[status] ?? BADGE_STYLES.healthy;
  return (
    <span
      style={{
        padding: "3px 9px",
        borderRadius: 12,
        background: m.bg,
        color: m.c,
        fontSize: 11.5,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: m.dot,
          animation: status === "deploying" ? "pulse 1s ease-in-out infinite" : "none",
        }}
      />
      {m.lbl}
    </span>
  );
};
