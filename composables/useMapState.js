const polarOrbitAngles = reactive({}) // { [planetSlug]: perpAngle } — updated each animation frame

const editPositions = ref(false)
const editCancelled = ref(false)
const viewingSystem = ref(null)
const selectedPlanetSlug = ref(null)
const selectedSystemSlug = ref(null)
const selectedBodyMemberIndex = ref(null)
const zoomTarget = ref(null) // { type: 'planet'|'system', slug }
const orbitEventPreview = ref(null) // { planetSlug, orbit: {before,after}|null, color: {before,after}|null, showAfter } | null — live before/after preview while editing an orbit event

const TIMELINE_NEWEST_FIRST_KEY = 'cosmere-tracker:timeline-newest-first'
const timelineNewestFirst = ref(false)
let timelineOrderInitialized = false

export function useMapState() {
  function startEdit() {
    editCancelled.value = false
    editPositions.value = true
  }

  function saveEdit() {
    editCancelled.value = false
    editPositions.value = false
  }

  function cancelEdit() {
    editCancelled.value = true
    editPositions.value = false
  }

  function initTimelineOrder() {
    if (timelineOrderInitialized) return
    try {
      timelineNewestFirst.value = localStorage.getItem(TIMELINE_NEWEST_FIRST_KEY) === 'true'
    } catch {
      timelineNewestFirst.value = false
    }
    timelineOrderInitialized = true
  }

  function setTimelineNewestFirst(value) {
    timelineNewestFirst.value = value
    localStorage.setItem(TIMELINE_NEWEST_FIRST_KEY, String(value))
  }

  return { editPositions, editCancelled, viewingSystem, selectedPlanetSlug, selectedSystemSlug, selectedBodyMemberIndex, zoomTarget, polarOrbitAngles, timelineNewestFirst, orbitEventPreview, startEdit, saveEdit, cancelEdit, initTimelineOrder, setTimelineNewestFirst }
}
