import { isEventTriggerReached } from '~/composables/useTimelineEvents.js'

/**
 * Resolves the effective value of `field` on the latest entry (scanning from
 * the end) whose linked Timeline Event has been reached per the timeline
 * scrubber — falling back to `baseline` if none has. Uses `field in ev`
 * rather than `ev[field] != null` so a legitimate falsy override value
 * (`false`, `0`, `''`) still counts as "this entry carries a change", not
 * just "this entry carries a change and it happens to be non-null".
 *
 * Events are appended chronologically as they're authored, so the latest
 * revealed one (scanning from the end) reflects current story state — not
 * just the first one in the array to have been revealed.
 */
function resolveField(events, field, baseline) {
  if (!events || events.length === 0) return baseline
  const match = [...events].reverse().find(ev =>
    field in ev &&
    isEventTriggerReached(ev.id)
  )
  return match ? match[field] : baseline
}

/** Resolves the effective orbit distance (px from star centre) for a planet. */
export function resolveOrbitDistance(events, baselineDist) {
  return resolveField(events, 'orbit_after', baselineDist)
}

/** Resolves the effective color for a planet. */
export function resolveColor(events, baseColor) {
  return resolveField(events, 'color_after', baseColor)
}

/** Resolves whether a planet/system currently exists. */
export function resolveExists(events, baselineExists) {
  return resolveField(events, 'exists_after', baselineExists)
}

/** Resolves an entity's (e.g. a Shard's) current status. */
export function resolveStatus(events, baselineStatus) {
  return resolveField(events, 'status_after', baselineStatus)
}

/** Resolves an entity's (e.g. a Shard's) current location (a system slug). */
export function resolveLocation(events, baselineSlug) {
  return resolveField(events, 'location_after', baselineSlug)
}

// A Shard whose resolved status lands here is no longer a distinct active
// Shard from that point on — splintered/destroyed (killed), or combined into
// a new fused Shard (e.g. Ruin + Preservation -> Harmony) — so it drops out
// of any "currently held Shards" view (map badges, Characters page filter).
export const TERMINAL_SHARD_STATUSES = ['splintered', 'destroyed', 'combined']

// A Shard/splinter-remnant that's formed by combination rather than present
// from the Shattering (e.g. Harmony, the Dor) starts out here instead of a
// normal "held" baseline — it doesn't exist as a distinct Shard *yet*,
// mirroring TERMINAL_SHARD_STATUSES at the other end of its lifespan. Kept
// separate from that list since the two mean opposite things (hasn't started
// vs. has ended), but combined below wherever a caller just needs "is this
// currently a distinct, active Shard at all."
export const NOT_YET_FORMED_SHARD_STATUSES = ['not yet formed']

export const INACTIVE_SHARD_STATUSES = [...NOT_YET_FORMED_SHARD_STATUSES, ...TERMINAL_SHARD_STATUSES]
