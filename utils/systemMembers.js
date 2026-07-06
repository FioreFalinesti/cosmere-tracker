// A system member is either a plain planet-slug string (shorthand for "just
// a planet, no per-member overrides") or an object carrying at least
// { slug, type } for stars/belts/comets/anomalies/any planet that needs
// per-member overrides. These are the one place that knows how to read
// either shape — every other file should go through them instead of
// re-deriving slug/type from `typeof member`.
export function memberSlug(member) {
  return typeof member === 'string' ? member : member.slug
}

export function memberType(member) {
  return typeof member === 'string' ? 'planet' : member.type
}

// Pre-migration Firestore documents may still carry the old `planets` array
// instead of `members` (see commit "Move planet-system relationship from
// planet.system_slug to system.planets array") — every new/cloned system
// only ever gets `members`, but this fallback stays defensively since we
// can't confirm every legacy doc has been migrated.
export function systemMembers(system) {
  return system?.members ?? system?.planets ?? []
}

// The slugs of a system's planet-type members only (stars/belts/anomalies excluded).
export function systemPlanetSlugs(system) {
  return systemMembers(system).filter(m => memberType(m) === 'planet').map(memberSlug)
}
