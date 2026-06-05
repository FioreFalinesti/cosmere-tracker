const polarOrbitAngles = reactive({}) // { [planetSlug]: perpAngle } — updated each animation frame

const editPositions = ref(false)
const editCancelled = ref(false)
const viewingSystem = ref(null)
const selectedPlanetSlug = ref(null)
const selectedSystemSlug = ref(null)
const selectedBodyMemberIndex = ref(null)
const zoomTarget = ref(null) // { type: 'planet'|'system', slug }

const HIDDEN_PLANETS_KEY = 'cosmere-tracker:hidden-planets'
const hiddenPlanetSlugs = ref([])
let hiddenPlanetsInitialized = false

export function useMapState() {
  function initHiddenPlanets() {
    if (hiddenPlanetsInitialized) return
    try {
      const stored = localStorage.getItem(HIDDEN_PLANETS_KEY)
      hiddenPlanetSlugs.value = stored ? JSON.parse(stored) : []
    } catch {
      hiddenPlanetSlugs.value = []
    }
    hiddenPlanetsInitialized = true
  }

  function togglePlanetVisibility(slug) {
    if (hiddenPlanetSlugs.value.includes(slug)) {
      hiddenPlanetSlugs.value = hiddenPlanetSlugs.value.filter(s => s !== slug)
    } else {
      hiddenPlanetSlugs.value = [...hiddenPlanetSlugs.value, slug]
    }
    localStorage.setItem(HIDDEN_PLANETS_KEY, JSON.stringify(hiddenPlanetSlugs.value))
  }

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

  return { editPositions, editCancelled, viewingSystem, selectedPlanetSlug, selectedSystemSlug, selectedBodyMemberIndex, zoomTarget, polarOrbitAngles, hiddenPlanetSlugs, initHiddenPlanets, togglePlanetVisibility, startEdit, saveEdit, cancelEdit }
}
