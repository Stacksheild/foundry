# Design tokens

Foundry's own token set (originated for this project — not derived from any
named corporate design system). Defined in code at
[`packages/ui/src/tokens.ts`](../packages/ui/src/tokens.ts).

## Color

| Token | Value | Use |
|---|---|---|
| `accent` | `#5258E4` | Primary actions, links, active nav state |
| `accentHover` | `#4248CC` | Hover state for primary actions |
| `accentBg` | `#ECEDF9` | Accent-tinted backgrounds (badges, active rows) |
| `accentBorder` | `rgba(82,88,228,.28)` | Borders on accent-tinted surfaces |
| `accentText` | `#3840B8` | Text on `accentBg` |
| `bg` | `#FFFFFF` | Page/surface background |
| `surface` | `#FAFAFA` | Secondary surface (panels, code blocks) |
| `border` | `#E8E8E8` | Default border |
| `borderStrong` | `#CCCCCC` | Emphasized border |
| `text` | `#1E1E1E` | Primary text |
| `textMid` | `#464646` | Secondary text |
| `textSub` | `#6B6B6B` | Tertiary/caption text |
| `textFaint` | `#A0A0A0` | Disabled/placeholder text |
| `success` | `#178B44` | Healthy/passing states |
| `successBg` | `#E6F4ED` | Success-tinted background |
| `warning` | `#A86C00` | Warning states |
| `warningBg` | `#FFF3CC` | Warning-tinted background |
| `danger` | `#D63B2A` | Error/destructive states |
| `dangerBg` | `#FDECEA` | Error-tinted background |

## Type scale

Base font: system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`).

| Token | Size |
|---|---|
| `xs` | 11px |
| `sm` | 12.5px |
| `base` | 13.5px |
| `md` | 15px |
| `lg` | 19px |
| `xl` | 22px |
| `2xl` | 30px |

## Spacing & radii

Spacing follows a 4px base unit (4, 8, 12, 16, 20, 24, 32...). Border radii:
`6px` for buttons/inputs, `8–10px` for cards, `50%` for avatars/status dots.
