function eventEffectiveYear(ev) {
  return ev.event_type === 'range' ? (ev.year_end ?? ev.year_start) : ev.year_start
}

/**
 * An orbit event is "revealed" once any Timeline Event that references it
 * (via orbit_event_ids) has reached its narrative year per the timeline
 * scrubber. An orbit event with no referencing Timeline Event is never
 * revealed — it's just sitting there unlinked.
 */
function isOrbitEventRevealed(orbitEventId, timelineEvents, nowYear) {
  return timelineEvents.some(ev =>
    (ev.orbit_event_ids ?? []).includes(orbitEventId) &&
    eventEffectiveYear(ev) <= nowYear
  )
}

/**
 * Resolves the effective orbit distance (px from star centre) for a planet,
 * applying any orbit_events override whose linked Timeline Event has been
 * reached per the timeline scrubber. An orbit event only counts if it
 * carries an orbit change — it may also carry an unrelated color change.
 *
 * Events are appended chronologically as they're authored, so the most
 * recently revealed one (scanning from the end) reflects current story
 * state — not just the first one in the array to have been revealed.
 */
export function resolveOrbitDistance(events, baselineDist, timelineEvents, nowYear) {
  if (!events || events.length === 0) return baselineDist
  const match = [...events].reverse().find(ev =>
    ev.orbit_after != null &&
    isOrbitEventRevealed(ev.id, timelineEvents, nowYear)
  )
  return match ? match.orbit_after : baselineDist
}

/**
 * Resolves the effective color for a planet, applying any orbit_events
 * color override whose linked Timeline Event has been reached. An orbit
 * event only counts if it carries a color change. See resolveOrbitDistance
 * for why the latest revealed event (not the first) wins.
 */
export function resolveColor(events, baseColor, timelineEvents, nowYear) {
  if (!events || events.length === 0) return baseColor
  const match = [...events].reverse().find(ev =>
    ev.color_after != null &&
    isOrbitEventRevealed(ev.id, timelineEvents, nowYear)
  )
  return match ? match.color_after : baseColor
}
