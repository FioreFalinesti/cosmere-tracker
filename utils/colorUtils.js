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
