import { ref, computed } from 'vue'
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'

const { items: events, init } = firestoreCollectionLoader(TIMELINE_EVENTS_COLLECTION)

const CURRENT_EVENT_KEY = 'cosmere-tracker:current-event'
const currentEventSlug = ref(null)
let currentEventInitialized = false

// Resolves every event's start/end/effective year in one pass, honoring
// anchor_slug + anchor_offset chains (an event with no anchor just uses its
// own year_start/year_end). Two structures are needed: `map` memoizes
// completed results across the whole event list (many events anchor off the
// same ancestor — e.g. "The Shattering" — and shouldn't be false-flagged as
// a cycle), while `inProgress` tracks only the slugs on the current
// recursion path, to actually detect cycles. A dangling anchor_slug or a
// genuine cycle resolves to null, same as an undated event.
const resolvedYears = computed(() => {
  const map = new Map()
  const bySlug = new Map(events.value.map(ev => [ev.slug, ev]))

  function resolve(ev, inProgress) {
    if (map.has(ev.slug)) return map.get(ev.slug)
    if (inProgress.has(ev.slug)) return null
    inProgress.add(ev.slug)

    let start
    if (ev.anchor_slug) {
      const anchor = bySlug.get(ev.anchor_slug)
      const anchorResolved = anchor ? resolve(anchor, inProgress) : null
      start = anchorResolved?.effective != null ? anchorResolved.effective + (ev.anchor_offset ?? 0) : null
    } else {
      start = ev.year_start ?? null
    }

    let end = null
    if (ev.event_type === 'range') {
      end = ev.duration != null && start != null ? start + ev.duration : (ev.year_end ?? null)
    }

    const effective = ev.event_type === 'range' ? (end ?? start) : start
    const result = { start, end, effective }
    inProgress.delete(ev.slug)
    map.set(ev.slug, result)
    return result
  }

  events.value.forEach(ev => resolve(ev, new Set()))
  return map
})

// year_start may be null for undated instance events, or for events dated
// via anchor_slug/anchor_offset instead of a literal year. Exported as a
// plain top-level function (not just via the useTimelineEvents() factory)
// so non-component hot-path code (utils/timelineFieldResolvers.js) can import it
// directly without allocating a whole composable instance per call.
export function eventYear(ev) {
  return resolvedYears.value.get(ev.slug)?.effective ?? null
}

export function resolvedYearStart(ev) {
  return resolvedYears.value.get(ev.slug)?.start ?? null
}

export function resolvedYearEnd(ev) {
  return resolvedYears.value.get(ev.slug)?.end ?? null
}

// The manual `order` field (set on creation/reorder) drives list display order.
// Falls back to the event's own year for events that predate the `order`
// field, so legacy data still sorts chronologically without a migration.
function effectiveOrder(ev) {
  return ev.order ?? eventYear(ev) ?? 0
}

// Undated events always go to the end of the list; dated events (absolute
// or anchored) get no explicit order so they fall back to chronological
// placement via effectiveOrder.
function computeOrder(isUndated) {
  return isUndated
    ? (events.value.length ? Math.max(...events.value.map(effectiveOrder)) : 0) + 1
    : null
}

// Mirrors one hop of resolvedYears' recursive resolve() — safe as a single
// hop (no cycle-guarding needed) because a draft's anchor must already be a
// saved event to be selectable in the form, so it's already fully resolved.
function computeEffectiveYearForPatch({ event_type, year_start, year_end, anchor_slug, anchor_offset, duration }) {
  let start
  if (anchor_slug) {
    const anchor = events.value.find(e => e.slug === anchor_slug)
    const anchorYear = anchor ? eventYear(anchor) : null
    start = anchorYear != null ? anchorYear + (anchor_offset ?? 0) : null
  } else {
    start = year_start
  }
  if (event_type !== 'range') return start
  const end = duration != null && start != null ? start + duration : year_end
  return end ?? start
}

// Slots a dated draft into its correct position among existing events
// without requiring a full "Resort by year" afterward — walks the
// currently-displayed order (which mixes legacy manual `order` values with
// year-fallback ones, see effectiveOrder) and finds the last/first neighbor
// whose own resolved year brackets this one, landing between their
// effectiveOrders. Fractional is fine since only relative comparison
// matters, not integer spacing. Undated events have no year to compare and
// are skipped — they keep sorting at the end via their own large sequential
// order, safely out of range of any fractional value produced here.
function computeYearOrder(year, excludeSlug) {
  if (year == null) return null
  let prev = null, next = null
  for (const ev of orderedEvents.value) {
    if (ev.slug === excludeSlug) continue
    const evYear = eventYear(ev)
    if (evYear == null) continue
    if (evYear <= year) prev = ev
    else { next = ev; break }
  }
  const prevOrder = prev ? effectiveOrder(prev) : null
  const nextOrder = next ? effectiveOrder(next) : null
  if (prevOrder != null && nextOrder != null) return (prevOrder + nextOrder) / 2
  if (prevOrder != null) return prevOrder + 1
  if (nextOrder != null) return nextOrder - 1
  return null
}

// Maps a TimelineEventForm draft to the Firestore patch shape. Shared by
// every place that submits the form (Settings' full editor, InfoPanel's
// quick-create for linking an orbit-event trigger) so they can't drift apart
// as fields are added — a quick-create that skipped a field here would
// silently lose anchored dating, entity tags, etc. `excludeSlug` should be
// the event's own slug when editing, so it doesn't get compared against
// itself when computing where it now belongs.
export function timelineDraftToPatch(draft, fallbackTitle = '', excludeSlug = null) {
  const isUndated = draft.yearMode === 'absolute' && draft.yearStart === ''
  const event_type = draft.type
  const year_start = draft.yearMode === 'absolute' && draft.yearStart !== '' ? Number(draft.yearStart) : null
  const year_end = draft.type === 'range' && draft.endMode === 'absolute' ? Number(draft.yearEnd) : null
  const anchor_slug = draft.yearMode === 'relative' ? draft.anchorSlug : null
  const anchor_offset = draft.yearMode === 'relative' ? Number(draft.anchorOffset) : null
  const duration = draft.type === 'range' && draft.endMode === 'duration' ? Number(draft.duration) : null
  const effectiveYear = computeEffectiveYearForPatch({ event_type, year_start, year_end, anchor_slug, anchor_offset, duration })

  return {
    title: draft.title.trim() || fallbackTitle,
    description: (draft.description ?? '').trim(),
    event_type,
    year_start,
    year_end,
    anchor_slug,
    anchor_offset,
    duration,
    book_slug: draft.bookSlug || null,
    planet_slug: draft.planetSlug || null,
    system_slug: draft.systemSlug || null,
    zoom_scope: draft.zoomScope === 'map' ? 'map' : (draft.planetSlug && draft.zoomScope === 'system' ? 'system' : null),
    orbit_event_ids: draft.orbitEventIds ?? [],
    entity_slugs: draft.entitySlugs ?? [],
    order: isUndated ? computeOrder(true) : computeYearOrder(effectiveYear, excludeSlug),
    estimated: !!draft.estimated,
  }
}

function emptyTimelineDraft() {
  return {
    type: 'instance', title: '', description: '',
    yearMode: 'absolute', yearStart: '', anchorSlug: '', anchorOffset: '',
    endMode: 'absolute', yearEnd: '', duration: '',
    bookSlug: '', systemSlug: '', planetSlug: '', zoomScope: 'planet', orbitEventIds: [], entitySlugs: [],
    estimated: false,
  }
}

const orderedEvents = computed(() => [...events.value].sort((a, b) => effectiveOrder(a) - effectiveOrder(b)))

// "Latest" for the scrubber default is chronological, independent of manual
// list order, and only considers dated events — undated events don't
// participate in the reveal mechanic.
const datedEvents = computed(() => events.value.filter(ev => eventYear(ev) != null))
const sortedByYear = computed(() => [...datedEvents.value].sort((a, b) => eventYear(a) - eventYear(b)))

const currentEvent = computed(() =>
  (currentEventSlug.value && events.value.find(e => e.slug === currentEventSlug.value)) ||
  sortedByYear.value[sortedByYear.value.length - 1] ||
  null
)

const currentIndex = computed(() => {
  if (!currentEvent.value) return -1
  return orderedEvents.value.findIndex(e => e.slug === currentEvent.value.slug)
})

// Whether the timeline scrubber has passed this event, by position in the
// display order rather than by year — an undated event still has a
// well-defined position, so (unlike a year comparison) this correctly
// reveals things tied to an undated event once it's reached, and doesn't
// require every reachable event to have a real date.
export function isReached(ev) {
  const idx = orderedEvents.value.findIndex(e => e.slug === ev.slug)
  return idx !== -1 && idx <= currentIndex.value
}

// The one true "has this triggerable thing happened yet" check — used for
// orbit/color changes and existence gating alike, regardless of which array
// (a planet's orbit_events or a system's existence_events) the trigger id
// lives in. Ids are UUIDs, so the two arrays can safely share the same
// `orbit_event_ids` link field on timeline events with no collision risk.
export function isEventTriggerReached(triggerId) {
  return events.value.some(ev => (ev.orbit_event_ids ?? []).includes(triggerId) && isReached(ev))
}

export function useTimelineEvents() {
  function initCurrentEvent() {
    if (currentEventInitialized) return
    try {
      currentEventSlug.value = localStorage.getItem(CURRENT_EVENT_KEY) || null
    } catch {
      currentEventSlug.value = null
    }
    currentEventInitialized = true
  }

  function setCurrentEvent(slug) {
    currentEventSlug.value = slug
    try { localStorage.setItem(CURRENT_EVENT_KEY, slug) } catch {}
  }

  // Moves the map camera to wherever the given event points — split out from
  // setCurrentEvent so selecting an event (e.g. clicking it in the timeline
  // list) no longer moves the camera on its own; callers now trigger this
  // explicitly (the timeline's "Go To" action), plus pages/index.vue calls it
  // once at load to focus the persisted current event.
  function zoomToEvent(slug) {
    const ev = events.value.find(e => e.slug === slug)
    if (!ev) return
    const { zoomTarget } = useMapState()
    if (ev.zoom_scope === 'map') zoomTarget.value = { type: 'map' }
    else if (ev.zoom_scope === 'system' && ev.system_slug) zoomTarget.value = { type: 'system', slug: ev.system_slug }
    else if (ev.planet_slug) zoomTarget.value = { type: 'planet', slug: ev.planet_slug }
    else if (ev.system_slug) zoomTarget.value = { type: 'system', slug: ev.system_slug }
  }

  async function addTimelineEvent({ title, description, event_type, year_start, year_end, anchor_slug, anchor_offset, duration, book_slug, planet_slug, system_slug, orbit_event_ids, entity_slugs, zoom_scope, estimated, order }) {
    const db = useFirestore()
    const isUndated = year_start == null && !anchor_slug
    const data = {
      title,
      description: description ?? '',
      event_type,
      year_start: year_start ?? null,
      year_end: event_type === 'range' ? (year_end ?? null) : null,
      anchor_slug: anchor_slug || null,
      anchor_offset: anchor_offset ?? null,
      duration: event_type === 'range' ? (duration ?? null) : null,
      book_slug,
      planet_slug: planet_slug || null,
      system_slug: system_slug || null,
      zoom_scope: zoom_scope || null,
      // Callers building this via timelineDraftToPatch already computed the
      // correct chronological slot (see computeYearOrder) — only fall back
      // to appending-at-end here for a caller that didn't supply one at all.
      order: order !== undefined ? order : computeOrder(isUndated),
      orbit_event_ids: orbit_event_ids ?? [],
      entity_slugs: entity_slugs ?? [],
      estimated: !!estimated,
    }
    const docRef = await addDoc(collection(db, TIMELINE_EVENTS_COLLECTION), data)
    if (!events.value.some(e => e.slug === docRef.id)) {
      events.value = [...events.value, { slug: docRef.id, ...data }]
    }
  }

  async function updateTimelineEvent(slug, patch) {
    const event = events.value.find(e => e.slug === slug)
    if (event) Object.assign(event, patch)
    const db = useFirestore()
    await updateDoc(doc(db, TIMELINE_EVENTS_COLLECTION, slug), patch)
  }

  async function deleteTimelineEvent(slug) {
    events.value = events.value.filter(e => e.slug !== slug)
    const db = useFirestore()
    await deleteDoc(doc(db, TIMELINE_EVENTS_COLLECTION, slug))
  }

  // Moves an event one slot up (-1) or down (+1) in the displayed order and
  // renumbers the whole list so the new sequence is explicit and stable.
  async function moveEvent(slug, direction) {
    const list = orderedEvents.value
    const idx = list.findIndex(e => e.slug === slug)
    const swapIdx = idx + direction
    if (idx === -1 || swapIdx < 0 || swapIdx >= list.length) return
    const reordered = [...list]
    ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]
    await Promise.all(reordered.map((ev, i) => updateTimelineEvent(ev.slug, { order: i })))
  }

  // Clears the manual `order` field on every event so the list re-derives
  // its position purely from resolved years — needed after a batch of
  // anchored/absolute events is added to a list that was previously
  // drag-reordered (drag-reordering stamps an explicit order on everything).
  async function resortByYear() {
    await Promise.all(events.value.map(ev => updateTimelineEvent(ev.slug, { order: null })))
  }

  return {
    events, init, addTimelineEvent, updateTimelineEvent, deleteTimelineEvent, moveEvent, resortByYear, computeOrder,
    orderedEvents, sortedByYear, currentEvent, currentEventSlug, eventYear, resolvedYearStart, resolvedYearEnd,
    isReached, isEventTriggerReached, initCurrentEvent, setCurrentEvent, zoomToEvent,
    timelineDraftToPatch, emptyTimelineDraft,
  }
}
