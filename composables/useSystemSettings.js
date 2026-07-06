import { doc, updateDoc, setDoc } from 'firebase/firestore'

const { items: systems, init } = firestoreCollectionLoader(SYSTEMS_COLLECTION)

// Every member-indexed setter shares this shape: patch the member at
// `memberIndex` via `patchFn`, write the whole `members` array back.
async function updateSystemMember(systemSlug, memberIndex, patchFn) {
  const system = systems.value.find(s => s.slug === systemSlug)
  if (!system) return
  const members = (system.members ?? []).map((m, i) => i === memberIndex ? patchFn(m) : m)
  system.members = members
  const db = useFirestore()
  await updateDoc(doc(db, SYSTEMS_COLLECTION, systemSlug), { members })
}

// Most per-member fields clear themselves (delete the key) when set back to
// null/undefined rather than storing an explicit null, so an unset field
// doesn't linger in Firestore. String members (plain planet-slug references
// with no attached fields) are left untouched — there's nothing on them to patch.
function memberFieldPatch(field, value) {
  return m => {
    if (typeof m === 'string') return m
    const { [field]: _old, ...rest } = m
    return value != null ? { ...rest, [field]: value } : rest
  }
}

export function useSystemSettings() {
  const setSystemName = makeFieldSetter(systems, SYSTEMS_COLLECTION, 'name')
  const setSystemExistsFromStart = makeFieldSetter(systems, SYSTEMS_COLLECTION, 'exists_from_start')
  const setSystemWiki = makeFieldSetter(systems, SYSTEMS_COLLECTION, 'wiki')
  const setSystemStarName = makeFieldSetter(systems, SYSTEMS_COLLECTION, 'star_name')
  const setSystemStarColor = makeFieldSetter(systems, SYSTEMS_COLLECTION, 'star_color')
  const setSystemStarSize = makeFieldSetter(systems, SYSTEMS_COLLECTION, 'star_size')
  const setSystemStarParticulateRing = makeFieldSetter(systems, SYSTEMS_COLLECTION, 'star_particulate_ring')
  const updateSystemMembers = makeFieldSetter(systems, SYSTEMS_COLLECTION, 'members')

  async function setSystemBodyParticulateRing(systemSlug, memberIndex, value) {
    await updateSystemMember(systemSlug, memberIndex, m => typeof m === 'string' ? m : { ...m, particulate_ring: value })
  }

  async function setSystemBodySize(systemSlug, memberIndex, size) {
    await updateSystemMember(systemSlug, memberIndex, memberFieldPatch('size', size))
  }

  async function setSystemBodyColor(systemSlug, memberIndex, color) {
    await updateSystemMember(systemSlug, memberIndex, memberFieldPatch('color', color))
  }

  async function setSystemBodyOrbitDistance(systemSlug, memberIndex, distance) {
    await updateSystemMember(systemSlug, memberIndex, memberFieldPatch('orbit_distance', distance))
  }

  async function setSystemBodyName(systemSlug, memberIndex, name) {
    await updateSystemMember(systemSlug, memberIndex, m => {
      if (typeof m === 'string') return m
      const { name: _n, ...rest } = m
      return name.trim() ? { ...rest, name: name.trim() } : rest
    })
  }

  async function setSystemMemberLagrangePoint(systemSlug, memberIndex, lagrangePoint) {
    await updateSystemMember(systemSlug, memberIndex, m => {
      if (lagrangePoint === null || lagrangePoint === undefined) {
        const { lagrange_point, ...rest } = m
        return rest
      }
      return { ...m, lagrange_point: lagrangePoint }
    })
  }

  async function batchUpdateSystemPositions(updates) {
    updates.forEach(({ slug, map_x, map_y }) => {
      const system = systems.value.find(s => s.slug === slug)
      if (system) { system.map_x = map_x; system.map_y = map_y }
    })
    const db = useFirestore()
    await Promise.all(
      updates.map(({ slug, map_x, map_y }) =>
        updateDoc(doc(db, SYSTEMS_COLLECTION, slug), { map_x, map_y })
      )
    )
  }

  async function cloneSystem(sourceSlug, newSlug, newName) {
    const source = systems.value.find(s => s.slug === sourceSlug)
    if (!source) throw new Error(`System "${sourceSlug}" not found`)
    const { slug: _slug, members: _members, ...rest } = source
    const newSystem = { ...rest, name: newName, members: [], map_x: (source.map_x ?? 0) + 50, map_y: (source.map_y ?? 0) + 50 }
    const db = useFirestore()
    await setDoc(doc(db, SYSTEMS_COLLECTION, newSlug), newSystem)
    if (!systems.value.some(s => s.slug === newSlug)) {
      systems.value = [...systems.value, { slug: newSlug, ...newSystem }]
    }
  }

  return { systems, init, cloneSystem, batchUpdateSystemPositions, updateSystemMembers, setSystemName, setSystemExistsFromStart, setSystemBodyName, setSystemBodyParticulateRing, setSystemBodySize, setSystemBodyColor, setSystemBodyOrbitDistance, setSystemWiki, setSystemStarName, setSystemStarColor, setSystemStarSize, setSystemStarParticulateRing, setSystemMemberLagrangePoint }
}
