/**
 * Returns the effective orbit fraction for a planet, applying any book-triggered
 * orbit override from the planet's orbit_events array.
 *
 * First matching event in orbit_events wins. Returns defaultFraction unchanged
 * if no event is triggered.
 *
 * @param {Array<{trigger_book: string, orbit_fraction: number}>} orbitEvents
 * @param {number} defaultFraction - value in [0, 1] from computeOrbitRadii
 * @param {string[]} readSlugs - currently-read book slugs
 * @returns {number} clamped to [0, 1]
 */
export function resolveOrbitFraction(orbitEvents, defaultFraction, readSlugs) {
  if (!orbitEvents || orbitEvents.length === 0) return defaultFraction
  const match = orbitEvents.find(ev => readSlugs.includes(ev.trigger_book))
  if (!match) return defaultFraction
  return Math.min(1, Math.max(0, match.orbit_fraction))
}
