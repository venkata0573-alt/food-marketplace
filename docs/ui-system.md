# Layer 10 — UI system

Design tokens, shared components, Storybook, accessibility gates, and i18n scaffolding for the web app.

## Design tokens (`packages/ui/tokens`)

Single source of truth in CSS custom properties (`tokens/tokens.css`) with TypeScript mirrors in `tokens/index.ts`:

| Category   | Examples                                                                            |
| ---------- | ----------------------------------------------------------------------------------- |
| Color      | semantic surfaces, text, borders, focus ring (light + `prefers-color-scheme: dark`) |
| Spacing    | 4px base scale (`--fm-space-*`)                                                     |
| Typography | font sizes, line heights, weights                                                   |
| Radius     | `--fm-radius-*`                                                                     |
| Shadow     | elevation tokens                                                                    |
| Motion     | durations + easing; `@media (prefers-reduced-motion: reduce)` zeroes transitions    |

Import in the app root layout:

```ts
import '@food-marketplace/ui/tokens.css';
```

**Lint:** `food-marketplace/no-hardcoded-design-values` errors on literal hex colors and `NNpx` in `packages/ui/src/components/**`. Stories and token files are excluded.

## Component library

Token-backed primitives in `packages/ui/src/components/` (Button, InputField, Card, Skeleton). Extend shadcn-style patterns with CSS modules referencing `var(--fm-*)` only.

## Storybook

```bash
pnpm --filter @food-marketplace/ui storybook
pnpm --filter @food-marketplace/ui build-storybook
```

One story file per component covering variants and states. `@storybook/addon-a11y` runs in dev; **CI builds Storybook** to catch broken stories.

## Accessibility (WCAG 2.2 AA target)

| Gate            | Mechanism                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Static analysis | `eslint-plugin-jsx-a11y` (flat recommended config)                                                                         |
| Component tests | `vitest-axe` on UI primitives + checkout form                                                                              |
| CI              | `pnpm test:a11y`                                                                                                           |
| UX              | `:focus-visible` rings via tokens; touch targets ≥ 44px on primary controls; `.sr-only` for screen-reader copy on checkout |

Manual QA: exercise checkout with VoiceOver/NVDA and keyboard-only navigation before release.

## Mobile-first

- Baseline layout at **375px** width in Storybook viewport defaults.
- Primary actions use min height **44px** (`--fm-touch-target-min`).

Validate on a mid-range Android device over **4G** (not only desktop); use Chrome remote debugging for real touch/latency.

## Internationalization

- **next-intl** with locales `en`, `es`, `zh` (`apps/web/messages/`).
- App routes under `app/[locale]/` (browse, cart, chefs).
- Middleware merges locale detection with existing cache/session headers; `/api` and `/health` skip i18n.

Add keys to all three message files when shipping new UI copy.

## Reduced motion & dark mode

Respect `prefers-reduced-motion` and `prefers-color-scheme: dark` in `tokens.css` — do not hardcode theme-specific colors in components.

## Related

- [Frontend architecture (Layer 9)](./frontend-architecture.md)
