const editPositions = ref(false)
const viewingSystem = ref(null)
const selectedPlanetSlug = ref(null)

export function useMapState() {
  return { editPositions, viewingSystem, selectedPlanetSlug }
}
