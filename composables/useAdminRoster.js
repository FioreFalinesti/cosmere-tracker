import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useFirestore } from './useFirebase'

const adminEmails = ref([])
let initialized = false

export function useAdminRoster() {
  function init() {
    if (initialized) return
    initialized = true
    onSnapshot(collection(useFirestore(), 'admins'), (snap) => {
      adminEmails.value = snap.docs.map(d => d.id).sort()
    })
  }

  async function addAdmin(email) {
    const normalized = email.trim().toLowerCase()
    if (!normalized) return
    await setDoc(doc(useFirestore(), 'admins', normalized), { addedAt: new Date().toISOString() })
  }

  async function removeAdmin(email) {
    await deleteDoc(doc(useFirestore(), 'admins', email))
  }

  return { adminEmails, init, addAdmin, removeAdmin }
}
