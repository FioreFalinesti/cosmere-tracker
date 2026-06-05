/**
 * Resolves the effective orbit distance (px from star centre) for a planet,
 * applying any book-triggered orbit override from orbit_events.
 * Events with type 'color' are ignored. Events with no type field are treated
 * as orbit events for backward compatibility.
 */
export function resolveOrbitDistance(events, baselineDist, innerR, autoOuterR, readSlugs) {
  if (!events || events.length === 0) return baselineDist
  const match = events.find(ev =>
    ev.type !== 'color' &&
    ev.orbit_distance != null &&
    readSlugs.includes(ev.trigger_book)
  )
  if (!match) return baselineDist
  return match.orbit_distance
}

/**
 * Resolves the effective color for a planet, applying any book-triggered
 * color override from orbit_events.
 */
export function resolveColor(events, baseColor, readSlugs) {
  if (!events || events.length === 0) return baseColor
  const match = events.find(ev =>
    ev.type === 'color' &&
    ev.color != null &&
    readSlugs.includes(ev.trigger_book)
  )
  return match ? match.color : baseColor
}
