const editPositions = ref(false)
const editCancelled = ref(false)
const viewingSystem = ref(null)
const selectedPlanetSlug = ref(null)

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

  return { editPositions, editCancelled, viewingSystem, selectedPlanetSlug, startEdit, saveEdit, cancelEdit }
}
