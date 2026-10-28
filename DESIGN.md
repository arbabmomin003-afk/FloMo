# FloMo — Design system

## Personality

FloMo is calm, direct, optimistic without false reassurance, and deliberately non-judgmental about spending. Avoid alarming dashboards, salesy financial jargon, artificial gamification and unnecessary notifications. The most important number should be understandable in a glance.

**Visual language**: sculpted cards, strong editorial type, generous negative space, quiet dividers, soft rounded corners, one fluorescent green action, and judicious red used for risk. No dependence on visual color alone for status.

## Brand palette

| Semantic token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F5F7F4` | `#0C100E` | App background |
| `--surface` | `#FFFFFF` | `#171C19` | Cards, dialogs |
| `--surface-mute` | `#F2F4F1` | `#202722` | Input fields, nested areas |
| `--ink` | `#141B17` | `#F3F6F3` | Main text |
| `--muted` | `#68736D` | `#9DA9A1` | Supporting text |
| `--line` | `#E9EDE9` | `#2B342D` | Dividers |
| `--green` | `#087B4C` | `#55E7A7` | Positive, financial room |
| `--red` | `#C52B3C` | `#FF777F` | Caution/risk cues |
| Primary button | `#0DB976` | `#0DB976` | Main action, dark label `#04180F` |

The hero deliberately remains a deep green-black surface in both modes to make the Safe to Spend number the centerpiece. Surrounding surfaces adapt fully to the selected appearance.

## Typography

Use the platform's system UI fonts: `-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, `SF Pro Text` where available, then system sans-serif fallbacks. No bundled proprietary Apple font files. Large financial figures use tabular numerals for easy scanning.

## Layout

- Mobile-first design; primary navigation always reachable at the bottom.
- Safe-area insets support notched phones and home indicator regions.
- Main actions and tap targets are designed around Apple's 44-point minimum recommendation.
- Desktop centers the mobile preview with a supporting editorial introduction.
- Touch-friendly modal sheets, familiar list rows, and simple two-column controls.

## Motion, themes and accessibility

- System Light/Dark preference by default; manual Light and Dark preferences when desired.
- Visual roles use custom light/dark semantic tokens, not naïve color inversions.
- Main text and accent-text contrast is designed for strong readability. Labels and icons supplement green/red status changes.
- Keyboard focus states; dialog labels; reduced-motion support; no hover-only interactions.
- Only standard system font faces and original vector-style icons are used.

## Product decisions

The original FloMo icon is generated brand artwork (supplied at multiple sizes), with a luminous green flowing 'f' and a small red dot, representing flow and a thoughtful pause. It is not an Apple icon, SF Symbol or affiliated Apple asset.

The feature called Ask FloMo is deliberately honest about its deterministic offline logic. A genuinely generative AI version should preserve the calculator as the authoritative decision engine and add plain-language coaching via a secure server-side model—not delegate numeric correctness to an LLM.
