import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'

const NOTES_DOC_ID = 'main'
const content = ref('')
const initialized = ref(false)
let unsubscribe = null

export function useAdminNotes() {
  async function init() {
    if (initialized.value) return
    const db = useFirestore()
    const docRef = doc(db, ADMIN_NOTES_COLLECTION, NOTES_DOC_ID)

    const snap = await getDoc(docRef)
    content.value = snap.data()?.content ?? ''
    initialized.value = true

    unsubscribe = onSnapshot(docRef, (s) => { content.value = s.data()?.content ?? '' }, (err) => console.error('[admin_notes snapshot]', err))
    if (typeof window !== 'undefined') window.addEventListener('beforeunload', () => unsubscribe?.())
  }

  async function saveNotes(value) {
    content.value = value
    const db = useFirestore()
    await setDoc(doc(db, ADMIN_NOTES_COLLECTION, NOTES_DOC_ID), { content: value })
  }

  return { content, init, saveNotes }
}
