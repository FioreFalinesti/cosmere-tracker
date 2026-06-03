import { collection, query, where, doc, updateDoc, getDocs, onSnapshot } from 'firebase/firestore'

const readSlugs = ref([])
const initialized = ref(false)

export function useReadBooks() {
  async function init() {
    if (initialized.value) return
    const db = useFirestore()

    const snap = await getDocs(query(collection(db, 'books'), where('read', '==', true)))
    readSlugs.value = snap.docs.map(d => d.id)
    initialized.value = true

    // Real-time updates after initial load
    onSnapshot(
      query(collection(db, 'books'), where('read', '==', true)),
      (snap) => { readSlugs.value = snap.docs.map(d => d.id) },
      (err) => console.error('[readBooks snapshot]', err)
    )
  }

  async function toggle(slug) {
    const wasRead = readSlugs.value.includes(slug)
    readSlugs.value = wasRead
      ? readSlugs.value.filter(s => s !== slug)
      : [...readSlugs.value, slug]
    const db = useFirestore()
    await updateDoc(doc(db, 'books', slug), { read: !wasRead })
  }

  function isRead(slug) {
    return readSlugs.value.includes(slug)
  }

  async function selectAll(slugs) {
    readSlugs.value = [...slugs]
    const db = useFirestore()
    await Promise.all(slugs.map(slug => updateDoc(doc(db, 'books', slug), { read: true })))
  }

  async function unselectAll(slugs) {
    readSlugs.value = []
    const db = useFirestore()
    await Promise.all(slugs.map(slug => updateDoc(doc(db, 'books', slug), { read: false })))
  }

  return { readSlugs, init, toggle, isRead, selectAll, unselectAll }
}
