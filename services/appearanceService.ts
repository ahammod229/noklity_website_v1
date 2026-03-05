export interface AppearanceSettings {
  primaryColor: string;
  primaryHoverColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  backgroundColorLight: string;
  backgroundColorDark: string;
  surfaceColorLight: string;
  surfaceColorDark: string;
  textColorLight: string;
  textColorDark: string;
  mutedTextColorLight: string;
  mutedTextColorDark: string;
  borderColorLight: string;
  borderColorDark: string;
  borderRadiusPx: number;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  primaryColor: '#e11d48',
  primaryHoverColor: '#be123c',
  accentColor: '#0f172a',
  successColor: '#16a34a',
  warningColor: '#f59e0b',
  dangerColor: '#dc2626',
  backgroundColorLight: '#ffffff',
  backgroundColorDark: '#0b1220',
  surfaceColorLight: '#ffffff',
  surfaceColorDark: '#111827',
  textColorLight: '#111827',
  textColorDark: '#e5e7eb',
  mutedTextColorLight: '#6b7280',
  mutedTextColorDark: '#94a3b8',
  borderColorLight: '#e5e7eb',
  borderColorDark: '#334155',
  borderRadiusPx: 12
};

const HEX_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeHex = (value: string | undefined, fallback: string) => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const prefixed = raw.startsWith('#') ? raw : `#${raw}`;
  return HEX_REGEX.test(prefixed) ? prefixed : fallback;
};

const expandHex = (hex: string) => {
  const normalized = normalizeHex(hex, '#000000').slice(1);
  if (normalized.length === 3) {
    return normalized
      .split('')
      .map((item) => item + item)
      .join('');
  }
  return normalized;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const expanded = expandHex(hex);
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return [r, g, b];
};

const rgbTupleToCss = (rgb: [number, number, number]) => `${rgb[0]} ${rgb[1]} ${rgb[2]}`;

const darkenHex = (hex: string, amount = 0.16) => {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 - clamp(amount, 0, 0.9);
  const next: [number, number, number] = [
    Math.round(r * factor),
    Math.round(g * factor),
    Math.round(b * factor)
  ];
  const toHex = (channel: number) => clamp(channel, 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(next[0])}${toHex(next[1])}${toHex(next[2])}`;
};

const asNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(Math.round(parsed), 4, 36);
};

export const toAppearanceFromRawSettings = (raw: Partial<Record<string, string | number | undefined>>) => {
  const primary = normalizeHex(String(raw.primary_color || ''), DEFAULT_APPEARANCE.primaryColor);
  const hoverCandidate = normalizeHex(String(raw.primary_hover_color || ''), darkenHex(primary));
  return {
    primaryColor: primary,
    primaryHoverColor: hoverCandidate,
    accentColor: normalizeHex(String(raw.accent_color || ''), DEFAULT_APPEARANCE.accentColor),
    successColor: normalizeHex(String(raw.success_color || ''), DEFAULT_APPEARANCE.successColor),
    warningColor: normalizeHex(String(raw.warning_color || ''), DEFAULT_APPEARANCE.warningColor),
    dangerColor: normalizeHex(String(raw.danger_color || ''), DEFAULT_APPEARANCE.dangerColor),
    backgroundColorLight: normalizeHex(
      String(raw.background_color_light || ''),
      DEFAULT_APPEARANCE.backgroundColorLight
    ),
    backgroundColorDark: normalizeHex(String(raw.background_color_dark || ''), DEFAULT_APPEARANCE.backgroundColorDark),
    surfaceColorLight: normalizeHex(String(raw.surface_color_light || ''), DEFAULT_APPEARANCE.surfaceColorLight),
    surfaceColorDark: normalizeHex(String(raw.surface_color_dark || ''), DEFAULT_APPEARANCE.surfaceColorDark),
    textColorLight: normalizeHex(String(raw.text_color_light || ''), DEFAULT_APPEARANCE.textColorLight),
    textColorDark: normalizeHex(String(raw.text_color_dark || ''), DEFAULT_APPEARANCE.textColorDark),
    mutedTextColorLight: normalizeHex(
      String(raw.muted_text_color_light || ''),
      DEFAULT_APPEARANCE.mutedTextColorLight
    ),
    mutedTextColorDark: normalizeHex(String(raw.muted_text_color_dark || ''), DEFAULT_APPEARANCE.mutedTextColorDark),
    borderColorLight: normalizeHex(String(raw.border_color_light || ''), DEFAULT_APPEARANCE.borderColorLight),
    borderColorDark: normalizeHex(String(raw.border_color_dark || ''), DEFAULT_APPEARANCE.borderColorDark),
    borderRadiusPx: asNumber(raw.border_radius_px, DEFAULT_APPEARANCE.borderRadiusPx)
  } satisfies AppearanceSettings;
};

export const applyAppearanceSettings = (appearance: Partial<AppearanceSettings>) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const resolved: AppearanceSettings = {
    ...DEFAULT_APPEARANCE,
    ...appearance
  };

  const setRgbVar = (key: string, hex: string) => {
    root.style.setProperty(key, rgbTupleToCss(hexToRgb(hex)));
  };

  setRgbVar('--color-primary-rgb', normalizeHex(resolved.primaryColor, DEFAULT_APPEARANCE.primaryColor));
  setRgbVar('--color-primary-hover-rgb', normalizeHex(resolved.primaryHoverColor, DEFAULT_APPEARANCE.primaryHoverColor));
  setRgbVar('--color-secondary-rgb', normalizeHex(resolved.accentColor, DEFAULT_APPEARANCE.accentColor));
  setRgbVar('--color-success-rgb', normalizeHex(resolved.successColor, DEFAULT_APPEARANCE.successColor));
  setRgbVar('--color-warning-rgb', normalizeHex(resolved.warningColor, DEFAULT_APPEARANCE.warningColor));
  setRgbVar('--color-danger-rgb', normalizeHex(resolved.dangerColor, DEFAULT_APPEARANCE.dangerColor));
  setRgbVar(
    '--background-light-rgb',
    normalizeHex(resolved.backgroundColorLight, DEFAULT_APPEARANCE.backgroundColorLight)
  );
  setRgbVar('--background-dark-rgb', normalizeHex(resolved.backgroundColorDark, DEFAULT_APPEARANCE.backgroundColorDark));
  setRgbVar('--surface-light-rgb', normalizeHex(resolved.surfaceColorLight, DEFAULT_APPEARANCE.surfaceColorLight));
  setRgbVar('--surface-dark-rgb', normalizeHex(resolved.surfaceColorDark, DEFAULT_APPEARANCE.surfaceColorDark));
  setRgbVar('--text-light-rgb', normalizeHex(resolved.textColorLight, DEFAULT_APPEARANCE.textColorLight));
  setRgbVar('--text-dark-rgb', normalizeHex(resolved.textColorDark, DEFAULT_APPEARANCE.textColorDark));
  setRgbVar(
    '--muted-text-light-rgb',
    normalizeHex(resolved.mutedTextColorLight, DEFAULT_APPEARANCE.mutedTextColorLight)
  );
  setRgbVar(
    '--muted-text-dark-rgb',
    normalizeHex(resolved.mutedTextColorDark, DEFAULT_APPEARANCE.mutedTextColorDark)
  );
  setRgbVar('--border-light-rgb', normalizeHex(resolved.borderColorLight, DEFAULT_APPEARANCE.borderColorLight));
  setRgbVar('--border-dark-rgb', normalizeHex(resolved.borderColorDark, DEFAULT_APPEARANCE.borderColorDark));
  root.style.setProperty('--radius-base', `${asNumber(resolved.borderRadiusPx, DEFAULT_APPEARANCE.borderRadiusPx)}px`);
};

