import { doc, setDoc } from 'firebase/firestore'

const { items: entities, init } = firestoreCollectionLoader(ENTITIES_COLLECTION)

export function useEntitySettings() {
  async function createEntity(slug, name, type, status) {
    const db = useFirestore()
    const data = {
      name, type, status,
      description: '', current_holder: '', splinter_remnant_slug: null, status_events: [],
      location_slug: null, location_events: [],
    }
    await setDoc(doc(db, ENTITIES_COLLECTION, slug), data)
    if (!entities.value.some(e => e.slug === slug)) {
      entities.value = [...entities.value, { slug, ...data }]
    }
  }

  const setEntityName = makeFieldSetter(entities, ENTITIES_COLLECTION, 'name')
  const setEntityStatus = makeFieldSetter(entities, ENTITIES_COLLECTION, 'status')
  const setEntityDescription = makeFieldSetter(entities, ENTITIES_COLLECTION, 'description')
  const setEntityHolder = makeFieldSetter(entities, ENTITIES_COLLECTION, 'current_holder')
  const setEntitySplinterRemnant = makeFieldSetter(entities, ENTITIES_COLLECTION, 'splinter_remnant_slug', v => v || null)
  const setEntityColor = makeFieldSetter(entities, ENTITIES_COLLECTION, 'color')
  const setEntityStatusEvents = makeFieldSetter(entities, ENTITIES_COLLECTION, 'status_events')
  const setEntityLocation = makeFieldSetter(entities, ENTITIES_COLLECTION, 'location_slug', v => v || null)
  const setEntityLocationEvents = makeFieldSetter(entities, ENTITIES_COLLECTION, 'location_events')

  return {
    entities, init, createEntity, setEntityName, setEntityStatus, setEntityDescription,
    setEntityHolder, setEntitySplinterRemnant, setEntityStatusEvents, setEntityColor,
    setEntityLocation, setEntityLocationEvents,
  }
}
