function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

function componentToHex(n) {
  return Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
}

function rgbToHex(r, g, b) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`
}

export function isValidHexColor(hex) {
  return typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex)
}

export function darkenHex(hex, factor = 0.3) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r * factor, g * factor, b * factor)
}

// Picks a light or dark grey for text/labels depending on how light or dark
// the given background color is, so the label stays readable over either a
// bright planet/star or a dark one.
export function contrastGrey(hex) {
  if (!hex) return '#e8e8e8'
  const { r, g, b } = hexToRgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#222222' : '#e8e8e8'
}

export function averageHexColors(hexColors) {
  const valid = hexColors.filter(isValidHexColor)
  if (!valid.length) return '#888888'
  const sum = valid.reduce((acc, hex) => {
    const c = hexToRgb(hex)
    return { r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }
  }, { r: 0, g: 0, b: 0 })
  const n = valid.length
  return rgbToHex(sum.r / n, sum.g / n, sum.b / n)
}

// Blends a hex color toward white by `amount` (0-1) — the sun/star glow
// gradient's midtone (SystemNode, SecondaryStarNode).
export function blendToWhite(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount)
}

// Desaturates a hex color toward its own greyscale value by `amount` (0-1) —
// used for uninhabited planets' dimmed orb color (PlanetNode).
export function desaturateHex(hex, amount = 0.65) {
  const { r, g, b } = hexToRgb(hex)
  const gray = 0.299 * r + 0.587 * g + 0.114 * b
  return rgbToHex(r + (gray - r) * amount, g + (gray - g) * amount, b + (gray - b) * amount)
}

// Lightens (amount > 0) or darkens (amount < 0) a hex color by `amount` —
// used for gas-giant banding and dwarf-planet texture (PlanetNode).
export function adjustHex(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  const adjust = n => amount > 0 ? n + (255 - n) * amount : n * (1 + amount)
  return rgbToHex(adjust(r), adjust(g), adjust(b))
}

// Blends a hex color toward a cold blue by `amount` (0-1) — used for dwarf
// planets further from their star (PlanetNode).
const COLD_BLUE = { r: 110, g: 160, b: 220 }
export function blendToBlue(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(
    r + (COLD_BLUE.r - r) * amount,
    g + (COLD_BLUE.g - g) * amount,
    b + (COLD_BLUE.b - b) * amount,
  )
}
