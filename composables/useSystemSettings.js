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

  async function updateSystemMembers(slug, members) {
    const system = systems.value.find(s => s.slug === slug)
    if (system) system.members = members
    const db = useFirestore()
    await updateDoc(doc(db, 'planetary_systems', slug), { members })
  }

  return { systems, init, batchUpdateSystemPositions, updateSystemMembers }
}
