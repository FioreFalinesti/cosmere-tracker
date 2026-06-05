/**
 * Resolves the effective orbit distance (px from star centre) for a planet,
 * applying any book-triggered orbit override from orbit_events.
 *
 * orbit_events still store a 0–1 fraction of the auto orbit range
 * [innerR, autoOuterR].  The baseline is the planet's manual orbit_distance
 * (px) if set, otherwise the auto-computed radius.
 */
export function resolveOrbitDistance(orbitEvents, baselineDist, innerR, autoOuterR, readSlugs) {
  if (!orbitEvents || orbitEvents.length === 0) return baselineDist
  const match = orbitEvents.find(ev => readSlugs.includes(ev.trigger_book))
  if (!match) return baselineDist
  return match.orbit_distance ?? baselineDist
}
