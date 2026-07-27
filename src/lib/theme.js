export const DEFAULT_THEME = {
  name: 'Aarvya Orange',
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FED7AA',
}

export const THEME_PRESETS = [
  { name: 'Aarvya Orange', primary: '#F97316' },
  { name: 'Rose Couture', primary: '#BE123C' },
  { name: 'Midnight Navy', primary: '#1E3A8A' },
  { name: 'Emerald Luxe', primary: '#059669' },
  { name: 'Royal Violet', primary: '#7C3AED' },
  { name: 'Onyx Gold', primary: '#B45309' },
  { name: 'Classic Black', primary: '#171717' },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '')
  if (value.length < 6) return null
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map(channel => clamp(channel, 0, 255).toString(16).padStart(2, '0')).join('')}`
}

export function shadeHex(hex, percent) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const ratio = percent / 100
  if (ratio >= 0) {
    return rgbToHex(
      Math.round(rgb.r + (255 - rgb.r) * ratio),
      Math.round(rgb.g + (255 - rgb.g) * ratio),
      Math.round(rgb.b + (255 - rgb.b) * ratio)
    )
  }
  const factor = 1 + ratio
  return rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor)
  )
}

export function buildThemeFromPrimary(primary, name = 'Custom') {
  return {
    name,
    primary,
    primaryDark: shadeHex(primary, -18),
    primaryLight: shadeHex(primary, 42),
  }
}

export function normalizeTheme(input) {
  if (!input?.primary) return { ...DEFAULT_THEME }
  return {
    name: input.name || 'Custom',
    primary: input.primary,
    primaryDark: input.primaryDark || buildThemeFromPrimary(input.primary).primaryDark,
    primaryLight: input.primaryLight || buildThemeFromPrimary(input.primary).primaryLight,
  }
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const normalized = normalizeTheme(theme)
  const root = document.documentElement
  root.style.setProperty('--color-primary', normalized.primary)
  root.style.setProperty('--color-primary-dark', normalized.primaryDark)
  root.style.setProperty('--color-primary-light', normalized.primaryLight)
  return normalized
}
