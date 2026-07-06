import { collection, query, orderBy, doc, updateDoc, setDoc, getDocs, onSnapshot } from 'firebase/firestore'
import { resolveColor } from '~/utils/orbitUtils'
import { darkenHex } from '~/utils/colorUtils'

const planets = ref([])
const initialized = ref(false)
let unsubscribe = null

// Orbit events predating the switch to Timeline-Event-triggered overrides
// have no `id` — backfill one so each is distinguishable (e.g. by the
// "Orbit Events to Trigger" checklist, which keys off this id).
async function backfillOrbitEventIds(planet) {
  const events = planet.orbit_events ?? []
  if (!events.some(ev => !ev.id)) return events
  const fixed = events.map(ev => ev.id ? ev : { ...ev, id: crypto.randomUUID() })
  const db = useFirestore()
  await updateDoc(doc(db, 'planets', planet.slug), { orbit_events: fixed })
  return fixed
}

export function usePlanetSettings() {
  async function init() {
    if (initialized.value) return
    const db = useFirestore()

    const snap = await getDocs(query(collection(db, 'planets'), orderBy('name')))
    planets.value = snap.docs.map(d => ({ slug: d.id, ...d.data() }))
    initialized.value = true

    await Promise.all(planets.value.map(async p => {
      p.orbit_events = await backfillOrbitEventIds(p)
    }))

    // Real-time updates after initial load
    unsubscribe = onSnapshot(
      query(collection(db, 'planets'), orderBy('name')),
      (snap) => { planets.value = snap.docs.map(d => ({ slug: d.id, ...d.data() })) },
      (err) => console.error('[planets snapshot]', err)
    )
    if (typeof window !== 'undefined') window.addEventListener('beforeunload', () => unsubscribe?.())
  }

  async function setColor(slug, color) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.color = color
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { color })
  }

  function nodeData(planet, preview) {
    const isGasGiant = planet.is_gas_giant ?? false
    const size = Math.floor(Math.max(0.1, planet.size_multiplier ?? 1) * 64)
    let color = resolveColor(planet.orbit_events ?? [], planet.color)
    if (preview && preview.color && preview.planetSlug === planet.slug) {
      color = preview.showAfter ? preview.color.after : preview.color.before
    }
    return { name: planet.name, color, colorDark: darkenHex(color), size, sizeMultiplier: planet.size_multiplier ?? 1, uninhabited: planet.uninhabited ?? false, moonCount: (planet.moons ?? []).length, isGasGiant, isDwarfPlanet: planet.is_dwarf_planet ?? false }
  }

  async function setWiki(slug, url) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.wiki = url
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { wiki: url })
  }

  async function updateMoons(slug, moons) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.moons = moons
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { moons })
  }

  async function setSizeMultiplier(slug, value) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.size_multiplier = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { size_multiplier: value })
  }

  async function setUninhabited(slug, value) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.uninhabited = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { uninhabited: value })
  }

  async function setExistsFromStart(slug, value) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.exists_from_start = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { exists_from_start: value })
  }

  async function setGasGiant(slug, value) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.is_gas_giant = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { is_gas_giant: value })
  }

  async function setDwarfPlanet(slug, value) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.is_dwarf_planet = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { is_dwarf_planet: value })
  }

  function computeOrbitRadii(members, innerR, outerR) {
    const n = members.length
    if (n === 0) return []
    const moonFactor = 0.12
    const gaps = new Array(n + 1).fill(1.0)
    members.forEach((member, i) => {
      const type = typeof member === 'string' ? 'planet' : member.type
      const slug = typeof member === 'string' ? member : member.slug
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

  async function setMoonOrbitDistances(slug, distances) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.moon_orbit_distances = distances
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { moon_orbit_distances: distances })
  }

  async function setOrbitDistance(slug, distance) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.orbit_distance = distance
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { orbit_distance: distance ?? null })
  }

  async function setTimelineEvents(slug, events) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.orbit_events = events
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { orbit_events: events })
  }

  async function setPlanetName(slug, name) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.name = name
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { name })
  }

  async function setSatelliteTilt(planetSlug, tilts) {
    const planet = planets.value.find(p => p.slug === planetSlug)
    if (planet) planet.satellite_tilts = tilts
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', planetSlug), { satellite_tilts: tilts })
  }

  async function setSatelliteThickness(planetSlug, thicknesses) {
    const planet = planets.value.find(p => p.slug === planetSlug)
    if (planet) planet.satellite_thicknesses = thicknesses
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', planetSlug), { satellite_thicknesses: thicknesses })
  }

  async function setSatelliteType(planetSlug, moonName, type) {
    const planet = planets.value.find(p => p.slug === planetSlug)
    if (!planet) return
    const types = { ...(planet.satellite_types ?? {}), [moonName]: type }
    planet.satellite_types = types
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', planetSlug), { satellite_types: types })
  }

  async function setMoonOrbitType(planetSlug, moonName, type) {
    const planet = planets.value.find(p => p.slug === planetSlug)
    if (!planet) return
    const types = { ...(planet.moon_orbit_types ?? {}), [moonName]: type }
    planet.moon_orbit_types = types
    const polar = (planet.polar_orbit_moons ?? []).filter(m => m !== moonName)
    if (type === 'polar') polar.push(moonName)
    planet.polar_orbit_moons = polar
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', planetSlug), { moon_orbit_types: types, polar_orbit_moons: polar })
  }

  async function renameMoon(planetSlug, oldName, newName) {
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
    await updateDoc(doc(db, 'planets', planetSlug), { moons, moon_orbit_distances: fractions, satellite_types: satTypes, satellite_thicknesses: satThick, satellite_tilts: satTilts, polar_orbit_moons: polar })
  }

  async function createPlanet(slug, name) {
    const db = useFirestore()
    await setDoc(doc(collection(db, 'planets'), slug), {
      name, color: '#888888', size_multiplier: 1.0, gravity_multiplier: 1.0,
      wiki: '', uninhabited: false, is_gas_giant: false, is_dwarf_planet: false, moons: [], orbit_events: [],
    })
  }

  return { planets, init, setColor, setWiki, setSizeMultiplier, setUninhabited, setExistsFromStart, setGasGiant, setDwarfPlanet, setOrbitDistance, setTimelineEvents, setMoonOrbitDistances, setMoonOrbitType, setSatelliteType, setSatelliteThickness, setSatelliteTilt, createPlanet, updateMoons, nodeData, computeOrbitRadii, setPlanetName, renameMoon }
}
