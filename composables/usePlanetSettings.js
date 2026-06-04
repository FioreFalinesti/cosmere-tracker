import { collection, query, orderBy, doc, updateDoc, setDoc, getDocs, onSnapshot } from 'firebase/firestore'

function darkenHex(hex, factor = 0.3) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const h = n => Math.round(n * factor).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

const planets = ref([])
const initialized = ref(false)

export function usePlanetSettings() {
  async function init() {
    if (initialized.value) return
    const db = useFirestore()

    const snap = await getDocs(query(collection(db, 'planets'), orderBy('name')))
    planets.value = snap.docs.map(d => ({ slug: d.id, ...d.data() }))
    initialized.value = true

    // Real-time updates after initial load
    onSnapshot(
      query(collection(db, 'planets'), orderBy('name')),
      (snap) => { planets.value = snap.docs.map(d => ({ slug: d.id, ...d.data() })) },
      (err) => console.error('[planets snapshot]', err)
    )
  }

  function getColor(slug) {
    return planets.value.find(p => p.slug === slug)?.color ?? '#ffffff'
  }

  async function setColor(slug, color) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.color = color
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { color })
  }

  async function batchUpdatePositions(updates) {
    updates.forEach(({ slug, map_x, map_y }) => {
      const planet = planets.value.find(p => p.slug === slug)
      if (planet) { planet.map_x = map_x; planet.map_y = map_y }
    })
    const db = useFirestore()
    await Promise.all(
      updates.map(({ slug, map_x, map_y }) =>
        updateDoc(doc(db, 'planets', slug), { map_x, map_y })
      )
    )
  }

  function nodeData(planet) {
    const color = planet.color
    const size = Math.floor(Math.max(0.1, planet.size_multiplier ?? 1) * 64)
    return { name: planet.name, color, colorDark: darkenHex(color), size, sizeMultiplier: planet.size_multiplier ?? 1, uninhabited: planet.uninhabited ?? false, moonCount: (planet.moons ?? []).length, ringCount: planet.ring_count ?? 0, isGasGiant: planet.is_gas_giant ?? false, isDwarfPlanet: planet.is_dwarf_planet ?? false }
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

  async function setRingCount(slug, value) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.ring_count = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { ring_count: value })
  }

  async function setUninhabited(slug, value) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.uninhabited = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { uninhabited: value })
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

  async function setMoonOrbitFractions(slug, fractions) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.moon_orbit_fractions = fractions
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { moon_orbit_fractions: fractions })
  }

  async function setPolarOrbitMoons(slug, moons) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.polar_orbit_moons = moons
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { polar_orbit_moons: moons })
  }

  async function setOrbitFraction(slug, fraction) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.orbit_fraction = fraction
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { orbit_fraction: fraction ?? null })
  }

  async function setOrbitEvents(slug, events) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.orbit_events = events
    const db = useFirestore()
    await updateDoc(doc(db, 'planets', slug), { orbit_events: events })
  }

  async function createPlanet(slug, name) {
    const db = useFirestore()
    await setDoc(doc(collection(db, 'planets'), slug), {
      name, color: '#888888', size_multiplier: 1.0, gravity_multiplier: 1.0,
      ring_count: 0, wiki: '', uninhabited: false, is_gas_giant: false, is_dwarf_planet: false, moons: [], orbit_events: [],
    })
  }

  return { planets, init, getColor, setColor, setWiki, setSizeMultiplier, setRingCount, setUninhabited, setGasGiant, setDwarfPlanet, setOrbitFraction, setOrbitEvents, setPolarOrbitMoons, setMoonOrbitFractions, createPlanet, updateMoons, nodeData, batchUpdatePositions, computeOrbitRadii }
}
