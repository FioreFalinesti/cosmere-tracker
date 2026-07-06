export function darkenHex(hex, factor = 0.3) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const h = n => Math.round(n * factor).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

// Picks a light or dark grey for text/labels depending on how light or dark
// the given background color is, so the label stays readable over either a
// bright planet/star or a dark one.
export function contrastGrey(hex) {
  if (!hex) return '#e8e8e8'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#222222' : '#e8e8e8'
}

export function averageHexColors(hexColors) {
  const valid = hexColors.filter(h => h && /^#[0-9a-f]{6}$/i.test(h))
  if (!valid.length) return '#888888'
  const sum = valid.reduce((acc, hex) => ({
    r: acc.r + parseInt(hex.slice(1, 3), 16),
    g: acc.g + parseInt(hex.slice(3, 5), 16),
    b: acc.b + parseInt(hex.slice(5, 7), 16),
  }), { r: 0, g: 0, b: 0 })
  const n = valid.length
  const h = v => Math.round(v / n).toString(16).padStart(2, '0')
  return `#${h(sum.r)}${h(sum.g)}${h(sum.b)}`
}
