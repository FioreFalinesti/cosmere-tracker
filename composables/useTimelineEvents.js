import { ref, computed } from 'vue'
import { collection, query, orderBy, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore'

const events = ref([])
const initialized = ref(false)
let unsubscribe = null

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
// so non-component hot-path code (utils/orbitUtils.js) can import it
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

// When the selected/latest current event is itself undated, falling back to
// Infinity would reveal every system/orbit-event that has ANY dated entry at
// all, no matter how far in the future — e.g. selecting an undated "some time
// after the Shattering" milestone would immediately spoil a system that only
// unlocks 9000 years later. Instead, walk backward through the display order
// to the nearest preceding dated event and use its year — "as far as we've
// read up to this point" — falling back to -Infinity (nothing revealed) only
// if there's no dated event before it at all.
const nowYear = computed(() => {
  if (!currentEvent.value) return -Infinity
  const year = eventYear(currentEvent.value)
  if (year != null) return year

  const list = orderedEvents.value
  const idx = list.findIndex(e => e.slug === currentEvent.value.slug)
  for (let i = idx - 1; i >= 0; i--) {
    const precedingYear = eventYear(list[i])
    if (precedingYear != null) return precedingYear
  }
  return -Infinity
})

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

    // Re-clicking the event that's already current wouldn't otherwise change
    // currentEventSlug/currentEvent's value, so pages/index.vue's reactive
    // watch on currentEvent (used for the initial-load zoom) wouldn't fire —
    // apply the zoom directly here so every click re-focuses the camera,
    // whether or not the selection actually changed.
    const ev = events.value.find(e => e.slug === slug)
    if (!ev) return
    const { zoomTarget } = useMapState()
    if (ev.zoom_scope === 'system' && ev.system_slug) zoomTarget.value = { type: 'system', slug: ev.system_slug }
    else if (ev.planet_slug) zoomTarget.value = { type: 'planet', slug: ev.planet_slug }
    else if (ev.system_slug) zoomTarget.value = { type: 'system', slug: ev.system_slug }
  }

  async function init() {
    if (initialized.value) return
    const db = useFirestore()

    const snap = await getDocs(collection(db, 'timeline_events'))
    events.value = snap.docs.map(d => ({ slug: d.id, ...d.data() }))
    initialized.value = true

    // Real-time updates after initial load
    unsubscribe = onSnapshot(
      collection(db, 'timeline_events'),
      (snap) => { events.value = snap.docs.map(d => ({ slug: d.id, ...d.data() })) },
      (err) => console.error('[timeline_events snapshot]', err)
    )
    if (typeof window !== 'undefined') window.addEventListener('beforeunload', () => unsubscribe?.())
  }

  async function addTimelineEvent({ title, description, event_type, year_start, year_end, anchor_slug, anchor_offset, duration, book_slug, planet_slug, system_slug, orbit_event_ids, entity_slugs, zoom_scope }) {
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
      order: computeOrder(isUndated),
      orbit_event_ids: orbit_event_ids ?? [],
      entity_slugs: entity_slugs ?? [],
    }
    const docRef = await addDoc(collection(db, 'timeline_events'), data)
    if (!events.value.some(e => e.slug === docRef.id)) {
      events.value = [...events.value, { slug: docRef.id, ...data }]
    }
  }

  async function updateTimelineEvent(slug, patch) {
    const event = events.value.find(e => e.slug === slug)
    if (event) Object.assign(event, patch)
    const db = useFirestore()
    await updateDoc(doc(db, 'timeline_events', slug), patch)
  }

  async function deleteTimelineEvent(slug) {
    events.value = events.value.filter(e => e.slug !== slug)
    const db = useFirestore()
    await deleteDoc(doc(db, 'timeline_events', slug))
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
    orderedEvents, sortedByYear, currentEvent, currentEventSlug, nowYear, eventYear, resolvedYearStart, resolvedYearEnd,
    isReached, isEventTriggerReached, initCurrentEvent, setCurrentEvent,
  }
}
