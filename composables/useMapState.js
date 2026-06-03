const editPositions = ref(false)
const editCancelled = ref(false)
const viewingSystem = ref(null)
const selectedPlanetSlug = ref(null)
const selectedSystemSlug = ref(null)
const zoomTarget = ref(null) // { type: 'planet'|'system', slug }

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

  return { editPositions, editCancelled, viewingSystem, selectedPlanetSlug, selectedSystemSlug, zoomTarget, startEdit, saveEdit, cancelEdit }
}
