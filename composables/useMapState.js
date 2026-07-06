// AppSidebar's expanded width — also used by MapSync to compute the map's
// available viewport width for centering/framing, so the two can't drift.
export const SIDEBAR_WIDTH = 480

const polarOrbitAngles = reactive({}) // { [planetSlug]: perpAngle } — updated each animation frame

const editPositions = ref(false)
const editCancelled = ref(false)
const viewingSystem = ref(null)
const selectedPlanetSlug = ref(null)
const selectedSystemSlug = ref(null)
const selectedBodyMemberIndex = ref(null)
const zoomTarget = ref(null) // { type: 'planet'|'system', slug }
const orbitEventPreview = ref(null) // { planetSlug, orbit: {before,after}|null, color: {before,after}|null, showAfter } | null — live before/after preview while editing an orbit event

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

  return { editPositions, editCancelled, viewingSystem, selectedPlanetSlug, selectedSystemSlug, selectedBodyMemberIndex, zoomTarget, polarOrbitAngles, orbitEventPreview, startEdit, saveEdit, cancelEdit }
}
