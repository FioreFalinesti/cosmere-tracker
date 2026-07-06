import { collection, doc, updateDoc, setDoc, getDocs, onSnapshot } from 'firebase/firestore'

const entities = ref([])
const initialized = ref(false)
let unsubscribe = null

export function useEntitySettings() {
  async function init() {
    if (initialized.value) return
    const db = useFirestore()

    const snap = await getDocs(collection(db, 'entities'))
    entities.value = snap.docs.map(d => ({ slug: d.id, ...d.data() }))
    initialized.value = true

    // Real-time updates after initial load
    unsubscribe = onSnapshot(
      collection(db, 'entities'),
      (snap) => { entities.value = snap.docs.map(d => ({ slug: d.id, ...d.data() })) },
      (err) => console.error('[entities snapshot]', err)
    )
    if (typeof window !== 'undefined') window.addEventListener('beforeunload', () => unsubscribe?.())
  }

  async function createEntity(slug, name, type, status) {
    const db = useFirestore()
    const data = {
      name, type, status,
      description: '', current_holder: '', splinter_remnant_slug: null, status_events: [],
      location_slug: null, location_events: [],
    }
    await setDoc(doc(db, 'entities', slug), data)
    if (!entities.value.some(e => e.slug === slug)) {
      entities.value = [...entities.value, { slug, ...data }]
    }
  }

  async function setEntityName(slug, name) {
    const entity = entities.value.find(e => e.slug === slug)
    if (entity) entity.name = name
    const db = useFirestore()
    await updateDoc(doc(db, 'entities', slug), { name })
  }

  async function setEntityStatus(slug, status) {
    const entity = entities.value.find(e => e.slug === slug)
    if (entity) entity.status = status
    const db = useFirestore()
    await updateDoc(doc(db, 'entities', slug), { status })
  }

  async function setEntityDescription(slug, description) {
    const entity = entities.value.find(e => e.slug === slug)
    if (entity) entity.description = description
    const db = useFirestore()
    await updateDoc(doc(db, 'entities', slug), { description })
  }

  async function setEntityHolder(slug, currentHolder) {
    const entity = entities.value.find(e => e.slug === slug)
    if (entity) entity.current_holder = currentHolder
    const db = useFirestore()
    await updateDoc(doc(db, 'entities', slug), { current_holder: currentHolder })
  }

  async function setEntitySplinterRemnant(slug, remnantSlug) {
    const entity = entities.value.find(e => e.slug === slug)
    if (entity) entity.splinter_remnant_slug = remnantSlug || null
    const db = useFirestore()
    await updateDoc(doc(db, 'entities', slug), { splinter_remnant_slug: remnantSlug || null })
  }

  async function setEntityColor(slug, color) {
    const entity = entities.value.find(e => e.slug === slug)
    if (entity) entity.color = color
    const db = useFirestore()
    await updateDoc(doc(db, 'entities', slug), { color })
  }

  async function setEntityStatusEvents(slug, statusEvents) {
    const entity = entities.value.find(e => e.slug === slug)
    if (entity) entity.status_events = statusEvents
    const db = useFirestore()
    await updateDoc(doc(db, 'entities', slug), { status_events: statusEvents })
  }

  async function setEntityLocation(slug, locationSlug) {
    const entity = entities.value.find(e => e.slug === slug)
    if (entity) entity.location_slug = locationSlug || null
    const db = useFirestore()
    await updateDoc(doc(db, 'entities', slug), { location_slug: locationSlug || null })
  }

  async function setEntityLocationEvents(slug, locationEvents) {
    const entity = entities.value.find(e => e.slug === slug)
    if (entity) entity.location_events = locationEvents
    const db = useFirestore()
    await updateDoc(doc(db, 'entities', slug), { location_events: locationEvents })
  }

  return {
    entities, init, createEntity, setEntityName, setEntityStatus, setEntityDescription,
    setEntityHolder, setEntitySplinterRemnant, setEntityStatusEvents, setEntityColor,
    setEntityLocation, setEntityLocationEvents,
  }
}
