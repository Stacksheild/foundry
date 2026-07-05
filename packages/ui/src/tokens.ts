export const tokens = {
  accent: "#5258E4",
  accentHover: "#4248CC",
  accentBg: "#ECEDF9",
  accentBorder: "rgba(82,88,228,.28)",
  accentText: "#3840B8",
  bg: "#FFFFFF",
  surface: "#FAFAFA",
  border: "#E8E8E8",
  borderStrong: "#CCCCCC",
  text: "#1E1E1E",
  textMid: "#464646",
  textSub: "#6B6B6B",
  textFaint: "#A0A0A0",
  success: "#178B44",
  successBg: "#E6F4ED",
  warning: "#A86C00",
  warningBg: "#FFF3CC",
  danger: "#D63B2A",
  dangerBg: "#FDECEA",
} as const;

export type Tokens = typeof tokens;
