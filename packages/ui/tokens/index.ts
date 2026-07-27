/** Design tokens — single source for CSS custom properties (no hex in components). */
export const color = {
  background: 'var(--fm-color-background)',
  foreground: 'var(--fm-color-foreground)',
  primary: 'var(--fm-color-primary)',
  primaryForeground: 'var(--fm-color-primary-foreground)',
  muted: 'var(--fm-color-muted)',
  border: 'var(--fm-color-border)',
  focusRing: 'var(--fm-color-focus-ring)',
  destructive: 'var(--fm-color-destructive)',
} as const;

export const spacing = {
  0: 'var(--fm-space-0)',
  1: 'var(--fm-space-1)',
  2: 'var(--fm-space-2)',
  3: 'var(--fm-space-3)',
  4: 'var(--fm-space-4)',
  5: 'var(--fm-space-5)',
  6: 'var(--fm-space-6)',
  touch: 'var(--fm-space-touch)',
} as const;

export const fontSize = {
  xs: 'var(--fm-text-xs)',
  sm: 'var(--fm-text-sm)',
  base: 'var(--fm-text-base)',
  lg: 'var(--fm-text-lg)',
  xl: 'var(--fm-text-xl)',
  '2xl': 'var(--fm-text-2xl)',
} as const;

export const radius = {
  sm: 'var(--fm-radius-sm)',
  md: 'var(--fm-radius-md)',
  lg: 'var(--fm-radius-lg)',
  full: 'var(--fm-radius-full)',
} as const;

export const shadow = {
  sm: 'var(--fm-shadow-sm)',
  md: 'var(--fm-shadow-md)',
} as const;

export const motion = {
  fast: 'var(--fm-motion-fast)',
  base: 'var(--fm-motion-base)',
  slow: 'var(--fm-motion-slow)',
} as const;

export const layout = {
  minViewport: 'var(--fm-layout-min-width)',
  touchTarget: 'var(--fm-layout-touch-min)',
} as const;
