import { collection, query, orderBy as fbOrderBy, doc, updateDoc, getDocs, onSnapshot } from 'firebase/firestore'

// Creates a reactive { items, initialized, init } trio backed by a Firestore
// collection: fetches once, then keeps `items` live via onSnapshot, with
// beforeunload cleanup. Shared by every settings/data composable so this
// fetch-then-subscribe boilerplate isn't hand-copied per collection.
export function firestoreCollectionLoader(collectionName, { orderByField } = {}) {
  const items = ref([])
  const initialized = ref(false)
  let unsubscribe = null

  function collectionRef(db) {
    return orderByField
      ? query(collection(db, collectionName), fbOrderBy(orderByField))
      : collection(db, collectionName)
  }

  async function init() {
    if (initialized.value) return
    const db = useFirestore()

    const snap = await getDocs(collectionRef(db))
    items.value = snap.docs.map(d => ({ slug: d.id, ...d.data() }))
    initialized.value = true

    unsubscribe = onSnapshot(
      collectionRef(db),
      (snap) => { items.value = snap.docs.map(d => ({ slug: d.id, ...d.data() })) },
      (err) => console.error(`[${collectionName} snapshot]`, err)
    )
    if (typeof window !== 'undefined') window.addEventListener('beforeunload', () => unsubscribe?.())
  }

  return { items, initialized, init }
}

// Returns a setter that patches one field on an item (by slug) both locally
// and in Firestore — the "find → mutate → updateDoc" shape every per-field
// setter across the settings composables shares. `transform` lets a setter
// coerce the incoming value (e.g. `?? null`) before it's stored either place.
export function makeFieldSetter(items, collectionName, field, transform = v => v) {
  return async function (slug, value) {
    const stored = transform(value)
    const item = items.value.find(i => i.slug === slug)
    if (item) item[field] = stored
    const db = useFirestore()
    await updateDoc(doc(db, collectionName, slug), { [field]: stored })
  }
}

// Same shape as makeFieldSetter, but for a field that holds a { [key]: value }
// map (e.g. a planet's per-moon satellite_types) — patches one key of the map.
export function makeMapFieldSetter(items, collectionName, field) {
  return async function (slug, key, value) {
    const item = items.value.find(i => i.slug === slug)
    if (!item) return
    const map = { ...(item[field] ?? {}), [key]: value }
    item[field] = map
    const db = useFirestore()
    await updateDoc(doc(db, collectionName, slug), { [field]: map })
  }
}
