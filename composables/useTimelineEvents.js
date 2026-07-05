import { ref, computed } from 'vue'
import { collection, query, orderBy, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore'

const events = ref([])
const initialized = ref(false)
let unsubscribe = null

const CURRENT_EVENT_KEY = 'cosmere-tracker:current-event'
const currentEventSlug = ref(null)
let currentEventInitialized = false

// year_start may be null for undated instance events.
function eventYear(ev) {
  return ev.event_type === 'range' ? (ev.year_end ?? ev.year_start) : ev.year_start
}

// The manual `order` field (set on creation/reorder) drives list display order.
// Falls back to the event's own year for events that predate the `order`
// field, so legacy data still sorts chronologically without a migration.
function effectiveOrder(ev) {
  return ev.order ?? eventYear(ev) ?? 0
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

const nowYear = computed(() => {
  const year = currentEvent.value ? eventYear(currentEvent.value) : null
  return year ?? Infinity
})

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

  async function addTimelineEvent({ title, description, event_type, year_start, year_end, book_slug, planet_slug, system_slug, orbit_event_ids }) {
    const db = useFirestore()
    // Undated events (no year_start) always go to the end of the list;
    // dated events fall back to chronological placement via effectiveOrder.
    const order = year_start == null
      ? (events.value.length ? Math.max(...events.value.map(effectiveOrder)) : 0) + 1
      : null
    const data = {
      title,
      description: description ?? '',
      event_type,
      year_start,
      year_end: event_type === 'range' ? year_end : null,
      book_slug,
      planet_slug: planet_slug || null,
      system_slug: system_slug || null,
      order,
      orbit_event_ids: orbit_event_ids ?? [],
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

  return {
    events, init, addTimelineEvent, updateTimelineEvent, deleteTimelineEvent, moveEvent,
    orderedEvents, sortedByYear, currentEvent, currentEventSlug, nowYear, eventYear, initCurrentEvent, setCurrentEvent,
  }
}
