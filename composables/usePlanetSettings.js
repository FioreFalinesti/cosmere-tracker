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
    return { name: planet.name, color, colorDark: darkenHex(color), size, uninhabited: planet.uninhabited ?? false, moonCount: (planet.moons ?? []).length, ringCount: planet.ring_count ?? 0 }
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

  async function createPlanet(slug, name) {
    const db = useFirestore()
    await setDoc(doc(collection(db, 'planets'), slug), {
      name, color: '#888888', size_multiplier: 1.0, gravity_multiplier: 1.0,
      ring_count: 0, wiki: '', uninhabited: false, moons: [],
    })
  }

  return { planets, init, getColor, setColor, setWiki, setSizeMultiplier, setRingCount, setUninhabited, createPlanet, updateMoons, nodeData, batchUpdatePositions }
}
