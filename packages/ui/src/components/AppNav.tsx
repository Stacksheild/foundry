import { tokens as T } from "../tokens";
import { Icon, type IconName } from "../icons";
import type { ScreenId } from "../types";

interface NavItem {
  id: string;
  icon: IconName;
  label: string;
  sub?: boolean;
}

const APP_NAV_ITEMS: NavItem[] = [
  { id: "overview", icon: "grid", label: "Overview" },
  { id: "deployments", icon: "deploy", label: "Deployments" },
  { id: "logs", icon: "logs", label: "Logs" },
  { id: "analytics", icon: "chart", label: "Analytics" },
  { id: "observ", icon: "eye", label: "Observability", sub: true },
  { id: "env", icon: "code", label: "Environment Vars" },
  { id: "domains", icon: "domain", label: "Domains" },
  { id: "integrations", icon: "layers", label: "Integrations" },
  { id: "agent", icon: "agent", label: "Agent", sub: true },
  { id: "settings", icon: "gear", label: "Settings", sub: true },
];

export const AppNav = ({
  active,
  setActive,
  setScreen,
  live,
}: {
  active: string;
  setActive: (id: string) => void;
  setScreen: (s: ScreenId) => void;
  live?: boolean;
}) => (
  <nav
    style={{
      width: 200,
      borderRight: `1px solid ${T.border}`,
      background: T.bg,
      flexShrink: 0,
      padding: "8px 0",
      overflowY: "auto",
    }}
  >
    {(live ? APP_NAV_ITEMS.filter((item) => item.id === "overview") : APP_NAV_ITEMS).map((item) => (
      <button
        key={item.id}
        onClick={() => {
          setActive(item.id);
          setScreen(item.id === "deployments" ? "deploy" : "dashboard");
        }}
        style={{
          width: "100%",
          padding: "8px 16px",
          textAlign: "left",
          border: "none",
          background: active === item.id ? T.accentBg : "transparent",
          color: active === item.id ? T.accent : T.textMid,
          fontWeight: active === item.id ? 600 : 400,
          fontSize: 13.5,
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <Icon name={item.icon} size={14} color={active === item.id ? T.accent : T.textSub} />
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.sub && <Icon name="chevR" size={10} color={T.textFaint} />}
      </button>
    ))}
  </nav>
);
