// Every star/planet's on-screen diameter is derived from its size_multiplier
// (or star_size) the same way — the one place this formula lives, so the
// map's rendered size and the settings-panel preview can't silently drift
// apart from each other.
export function bodyVisualSize(sizeMultiplier) {
  return Math.floor(Math.max(0.1, sizeMultiplier ?? 1) * 64)
}
