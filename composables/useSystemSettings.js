import { collection, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore'

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

  async function setStarSupergiant(slug, value) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.is_supergiant = value
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { is_supergiant: value })
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

  return { systems, init, batchUpdateSystemPositions, setSystemSize, updateSystemMembers, setStarName, setStarColor, setStarSupergiant, setBinary, setSecondaryStarName, setSecondaryStarColor, setSecondaryStarSize, setSecondaryStarOrbitFraction, setMemberLagrangePoint }
}
