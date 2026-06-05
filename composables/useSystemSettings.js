import { collection, getDocs, doc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore'

const systems = ref([])
const initialized = ref(false)

export function useSystemSettings() {
  async function init() {
    if (initialized.value) return
    const db = useFirestore()

    const snap = await getDocs(collection(db, 'planetary_systems'))
    systems.value = snap.docs.map(d => ({ slug: d.id, ...d.data() }))
    initialized.value = true

    // Real-time updates after initial load
    onSnapshot(
      collection(db, 'planetary_systems'),
      (snap) => { systems.value = snap.docs.map(d => ({ slug: d.id, ...d.data() })) },
      (err) => console.error('[systems snapshot]', err)
    )
  }

  async function setSystemName(slug, name) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.name = name
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { name })
  }

  async function setSystemBodyParticulateRing(systemSlug, memberIndex, value) {
    const system = systems.value.find(s => s.slug === systemSlug)
    if (!system) return
    const members = (system.members ?? []).map((m, i) => {
      if (i !== memberIndex || typeof m === 'string') return m
      return { ...m, particulate_ring: value }
    })
    system.members = members
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', systemSlug), { members })
  }

  async function setSystemBodySize(systemSlug, memberIndex, size) {
    const system = systems.value.find(s => s.slug === systemSlug)
    if (!system) return
    const members = (system.members ?? []).map((m, i) => {
      if (i !== memberIndex || typeof m === 'string') return m
      const { size: _s, ...rest } = m
      return size != null ? { ...rest, size } : rest
    })
    system.members = members
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', systemSlug), { members })
  }

  async function setSystemBodyColor(systemSlug, memberIndex, color) {
    const system = systems.value.find(s => s.slug === systemSlug)
    if (!system) return
    const members = (system.members ?? []).map((m, i) => {
      if (i !== memberIndex || typeof m === 'string') return m
      const { color: _c, ...rest } = m
      return color != null ? { ...rest, color } : rest
    })
    system.members = members
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', systemSlug), { members })
  }

  async function setSystemBodyOrbitDistance(systemSlug, memberIndex, distance) {
    const system = systems.value.find(s => s.slug === systemSlug)
    if (!system) return
    const members = (system.members ?? []).map((m, i) => {
      if (i !== memberIndex || typeof m === 'string') return m
      const { orbit_distance: _d, ...rest } = m
      return distance != null ? { ...rest, orbit_distance: distance } : rest
    })
    system.members = members
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', systemSlug), { members })
  }

  async function setSystemBodyName(systemSlug, memberIndex, name) {
    const system = systems.value.find(s => s.slug === systemSlug)
    if (!system) return
    const members = (system.members ?? []).map((m, i) => {
      if (i !== memberIndex || typeof m === 'string') return m
      const { name: _n, ...rest } = m
      return name.trim() ? { ...rest, name: name.trim() } : rest
    })
    system.members = members
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', systemSlug), { members })
  }

  async function batchUpdateSystemPositions(updates) {
    updates.forEach(({ slug, map_x, map_y }) => {
      const system = systems.value.find(s => s.slug === slug)
      if (system) { system.map_x = map_x; system.map_y = map_y }
    })
    const db = useFirestore()
    await Promise.all(
      updates.map(({ slug, map_x, map_y }) =>
        updateDoc(doc(db, 'planetary_systems', slug), { map_x, map_y })
      )
    )
  }

  async function setSystemSize(slug, size) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.size = size
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { size })
  }

  async function updateSystemMembers(slug, members) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.members = members
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { members })
  }

  async function setStarName(slug, name) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.star_name = name
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { star_name: name })
  }

  async function setStarColor(slug, color) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.star_color = color
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { star_color: color })
  }

  async function setBinary(slug, value) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.is_binary = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { is_binary: value })
  }

  async function setSecondaryStarName(slug, name) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.secondary_star_name = name
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { secondary_star_name: name })
  }

  async function setSecondaryStarColor(slug, color) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.secondary_star_color = color
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { secondary_star_color: color })
  }

  async function setSecondaryStarSize(slug, value) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.secondary_star_size = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { secondary_star_size: value })
  }

  async function setSystemWiki(slug, url) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.wiki = url
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { wiki: url })
  }

  async function setStarSize(slug, value) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.star_size = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { star_size: value })
  }

  async function setStarParticulateRing(slug, value) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.star_particulate_ring = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { star_particulate_ring: value })
  }

  async function setSecondaryStarParticulateRing(slug, value) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.secondary_star_particulate_ring = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { secondary_star_particulate_ring: value })
  }

  async function setSecondaryStarOrbitFraction(slug, fraction) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.secondary_star_orbit_fraction = fraction
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { secondary_star_orbit_fraction: fraction })
  }

  async function setMemberLagrangePoint(systemSlug, memberIndex, lagrangePoint) {
    const system = systems.value.find(s => s.slug === systemSlug)
    if (!system) return
    const members = (system.members ?? []).map((m, i) => {
      if (i !== memberIndex) return m
      if (lagrangePoint === null || lagrangePoint === undefined) {
        const { lagrange_point, ...rest } = m
        return rest
      }
      return { ...m, lagrange_point: lagrangePoint }
    })
    system.members = members
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', systemSlug), { members })
  }

  async function cloneSystem(sourceSlug, newSlug, newName) {
    const source = systems.value.find(s => s.slug === sourceSlug)
    if (!source) throw new Error(`System "${sourceSlug}" not found`)
    const { slug: _slug, members: _members, ...rest } = source
    const newSystem = { ...rest, name: newName, members: [], map_x: (source.map_x ?? 0) + 50, map_y: (source.map_y ?? 0) + 50 }
    const db = useFirestore()
    await setDoc(doc(db, 'planetary_systems', newSlug), newSystem)
    systems.value = [...systems.value, { slug: newSlug, ...newSystem }]
  }

  return { systems, init, cloneSystem, batchUpdateSystemPositions, updateSystemMembers, setSystemName, setSystemBodyName, setSystemBodyParticulateRing, setSystemBodySize, setSystemBodyColor, setSystemBodyOrbitDistance, setSystemWiki, setStarName, setStarColor, setStarSize, setStarParticulateRing, setBinary, setSecondaryStarName, setSecondaryStarColor, setSecondaryStarSize, setSecondaryStarParticulateRing, setSecondaryStarOrbitFraction, setMemberLagrangePoint }
}
