export const BREAKPOINTS = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
  xxxl: 1600
} as const;

export type ViewportBand = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export const getViewportBand = (width: number): ViewportBand => {
  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS.xxl) return 'xl';
  return 'xxl';
};
