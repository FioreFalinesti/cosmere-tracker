import { doc, updateDoc, setDoc } from 'firebase/firestore'
import { resolveColor } from '~/utils/timelineFieldResolvers'
import { darkenHex } from '~/utils/colorUtils'
import { memberSlug, memberType } from '~/utils/systemMembers'
import { bodyVisualSize } from '~/utils/bodyVisuals'

const { items: planets, initialized, init: initPlanetsCollection } = firestoreCollectionLoader(PLANETS_COLLECTION, { orderByField: 'name' })

// Orbit events predating the switch to Timeline-Event-triggered overrides
// have no `id` — backfill one so each is distinguishable (e.g. by the
// "Orbit Events to Trigger" checklist, which keys off this id).
async function backfillOrbitEventIds(planet) {
  const events = planet.orbit_events ?? []
  if (!events.some(ev => !ev.id)) return events
  const fixed = events.map(ev => ev.id ? ev : { ...ev, id: crypto.randomUUID() })
  const db = useFirestore()
  await updateDoc(doc(db, PLANETS_COLLECTION, planet.slug), { orbit_events: fixed })
  return fixed
}

export function usePlanetSettings() {
  async function init() {
    const wasInitialized = initialized.value
    await initPlanetsCollection()
    // Only backfill right after the actual first load — repeating it on every
    // init() call would just re-scan every planet for no reason once loaded.
    if (!wasInitialized) {
      await Promise.all(planets.value.map(async p => {
        p.orbit_events = await backfillOrbitEventIds(p)
      }))
    }
  }

  function nodeData(planet, preview) {
    const isGasGiant = planet.is_gas_giant ?? false
    const size = bodyVisualSize(planet.size_multiplier)
    let color = resolveColor(planet.orbit_events ?? [], planet.color)
    if (preview && preview.color && preview.planetSlug === planet.slug) {
      color = preview.showAfter ? preview.color.after : preview.color.before
    }
    return { name: planet.name, color, colorDark: darkenHex(color), size, sizeMultiplier: planet.size_multiplier ?? 1, uninhabited: planet.uninhabited ?? false, moonCount: (planet.moons ?? []).length, isGasGiant, isDwarfPlanet: planet.is_dwarf_planet ?? false }
  }

  function computeOrbitRadii(members, innerR, outerR) {
    const n = members.length
    if (n === 0) return []
    const moonFactor = 0.12
    const gaps = new Array(n + 1).fill(1.0)
    members.forEach((member, i) => {
      const type = memberType(member)
      const slug = memberSlug(member)
      if (type !== 'planet') return
      const planet = planets.value.find(p => p.slug === slug)
      const moons = planet?.moons?.length ?? 0
      if (moons > 0) {
        gaps[i]     += moons * moonFactor
        gaps[i + 1] += moons * moonFactor
      }
    })
    const total = gaps.reduce((a, b) => a + b, 0)
    let cumulative = 0
    return members.map((_, i) => {
      cumulative += gaps[i]
      return innerR + (cumulative / total) * (outerR - innerR)
    })
  }

  const setPlanetColor = makeFieldSetter(planets, PLANETS_COLLECTION, 'color')
  const setPlanetWiki = makeFieldSetter(planets, PLANETS_COLLECTION, 'wiki')
  const updatePlanetMoons = makeFieldSetter(planets, PLANETS_COLLECTION, 'moons')
  const setPlanetSizeMultiplier = makeFieldSetter(planets, PLANETS_COLLECTION, 'size_multiplier')
  const setPlanetUninhabited = makeFieldSetter(planets, PLANETS_COLLECTION, 'uninhabited')
  const setPlanetExistsFromStart = makeFieldSetter(planets, PLANETS_COLLECTION, 'exists_from_start')
  const setPlanetGasGiant = makeFieldSetter(planets, PLANETS_COLLECTION, 'is_gas_giant')
  const setPlanetDwarfPlanet = makeFieldSetter(planets, PLANETS_COLLECTION, 'is_dwarf_planet')
  const setPlanetMoonOrbitDistances = makeFieldSetter(planets, PLANETS_COLLECTION, 'moon_orbit_distances')
  const setPlanetOrbitDistance = makeFieldSetter(planets, PLANETS_COLLECTION, 'orbit_distance', d => d ?? null)
  const setPlanetOrbitEvents = makeFieldSetter(planets, PLANETS_COLLECTION, 'orbit_events')
  const setPlanetName = makeFieldSetter(planets, PLANETS_COLLECTION, 'name')
  const setPlanetSatelliteTilt = makeFieldSetter(planets, PLANETS_COLLECTION, 'satellite_tilts')
  const setPlanetSatelliteThickness = makeFieldSetter(planets, PLANETS_COLLECTION, 'satellite_thicknesses')
  const setPlanetSatelliteType = makeMapFieldSetter(planets, PLANETS_COLLECTION, 'satellite_types')

  async function setPlanetMoonOrbitType(planetSlug, moonName, type) {
    const planet = planets.value.find(p => p.slug === planetSlug)
    if (!planet) return
    const types = { ...(planet.moon_orbit_types ?? {}), [moonName]: type }
    planet.moon_orbit_types = types
    const polar = (planet.polar_orbit_moons ?? []).filter(m => m !== moonName)
    if (type === 'polar') polar.push(moonName)
    planet.polar_orbit_moons = polar
    const db = useFirestore()
    await updateDoc(doc(db, PLANETS_COLLECTION, planetSlug), { moon_orbit_types: types, polar_orbit_moons: polar })
  }

  async function renamePlanetMoon(planetSlug, oldName, newName) {
    const planet = planets.value.find(p => p.slug === planetSlug)
    if (!planet || !newName.trim() || oldName === newName) return
    const moons = (planet.moons ?? []).map(m => m === oldName ? newName : m)
    const fractions = { ...(planet.moon_orbit_distances ?? {}) }
    if (fractions[oldName] !== undefined) {
      fractions[newName] = fractions[oldName]
      delete fractions[oldName]
    }
    const satTypes = { ...(planet.satellite_types ?? {}) }
    if (satTypes[oldName] !== undefined) { satTypes[newName] = satTypes[oldName]; delete satTypes[oldName] }
    const satThick = { ...(planet.satellite_thicknesses ?? {}) }
    if (satThick[oldName] !== undefined) { satThick[newName] = satThick[oldName]; delete satThick[oldName] }
    const satTilts = { ...(planet.satellite_tilts ?? {}) }
    if (satTilts[oldName] !== undefined) { satTilts[newName] = satTilts[oldName]; delete satTilts[oldName] }
    const polar = (planet.polar_orbit_moons ?? []).map(m => m === oldName ? newName : m)
    planet.moons = moons
    planet.moon_orbit_distances = fractions
    planet.satellite_types = satTypes
    planet.satellite_thicknesses = satThick
    planet.satellite_tilts = satTilts
    planet.polar_orbit_moons = polar
    const db = useFirestore()
    await updateDoc(doc(db, PLANETS_COLLECTION, planetSlug), { moons, moon_orbit_distances: fractions, satellite_types: satTypes, satellite_thicknesses: satThick, satellite_tilts: satTilts, polar_orbit_moons: polar })
  }

  async function createPlanet(slug, name) {
    const db = useFirestore()
    await setDoc(doc(db, PLANETS_COLLECTION, slug), {
      name, color: '#888888', size_multiplier: 1.0, gravity_multiplier: 1.0,
      wiki: '', uninhabited: false, is_gas_giant: false, is_dwarf_planet: false, moons: [], orbit_events: [],
    })
  }

  return { planets, init, setPlanetColor, setPlanetWiki, setPlanetSizeMultiplier, setPlanetUninhabited, setPlanetExistsFromStart, setPlanetGasGiant, setPlanetDwarfPlanet, setPlanetOrbitDistance, setPlanetOrbitEvents, setPlanetMoonOrbitDistances, setPlanetMoonOrbitType, setPlanetSatelliteType, setPlanetSatelliteThickness, setPlanetSatelliteTilt, createPlanet, updatePlanetMoons, nodeData, computeOrbitRadii, setPlanetName, renamePlanetMoon }
}
