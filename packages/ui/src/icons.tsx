import type { CSSProperties } from "react";

export const ICON_PATHS = {
  send: "M2 12L13 7 2 2v4l8 1-8 1v4z",
  plus: "M7 1v12M1 7h12",
  x: "M3 3l8 8M11 3l-8 8",
  check: "M2 7l3.5 3.5 6.5-6",
  chevR: "M5 3l5 4-5 4",
  refresh: "M12 6A5 5 0 107 2M12 2v4H8",
  grid: "M1.5 1.5h4v4h-4zM8.5 1.5h4v4h-4zM1.5 8.5h4v4h-4zM8.5 8.5h4v4h-4z",
  deploy: "M7 2v9M3 7l4-5 4 5M4 13h6",
  logs: "M2 3h10M2 6.5h8M2 10h6",
  chart: "M2 12V6l3-3 3 3 4-5v11",
  eye: "M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4zm6-1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z",
  warn: "M7 1L1 13h12L7 1zm0 4.5V9m0 2.5v.01",
  dots: "M3.5 7a1 1 0 102 0 1 1 0 00-2 0M6.5 7a1 1 0 102 0 1 1 0 00-2 0M9.5 7a1 1 0 102 0 1 1 0 00-2 0",
  pulse: "M1 7h2l2-5 2 9 2-4 2 0",
  gear: "M7 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.6 2.6l1 1M10.4 10.4l1 1M2.6 11.4l1-1M10.4 3.6l1-1",
  agent: "M5 3.5a2 2 0 100 4 2 2 0 000-4zM9 3.5a2 2 0 100 4 2 2 0 000-4zM2 13c0-2 1.3-3 3-3M12 13c0-2-1.3-3-3-3M7 10.5V13",
  sparkle: "M7 1l1.2 4.2 4 .8-4 .8L7 11l-1.2-4.2-4-.8 4-.8L7 1z",
  layers: "M7 2L2 5l5 3 5-3-5-3zM2 9l5 3 5-3M2 7l5 3 5-3",
  code: "M4 4L1 7l3 3M10 4l3 3-3 3M8 2L6 12",
  domain:
    "M7 1a6 6 0 100 12A6 6 0 007 1zM7 1c-1.7 2-2.6 3.8-2 5 .5 1.4 1.3 3 2 5 .7-2 1.5-3.6 2-5 .6-1.2-.3-3-2-5zM1 7h12",
} as const;

export type IconName = keyof typeof ICON_PATHS;

export const Icon = ({
  name,
  size = 14,
  color,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    stroke={color || "currentColor"}
    strokeWidth="1.35"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    <path d={ICON_PATHS[name]} />
  </svg>
);

export const FoundryLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="22" fill="#5258E4" />
    <path d="M30 28h42v14H46v12h22v14H46v22H30V28z" fill="white" />
  </svg>
);
