import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { useFirebaseAuth, useFirestore } from './useFirebase'

const currentUser = ref(null)
const isAdmin = ref(false)
let authInitialized = false
let resolveAuthReady
const authReady = new Promise((resolve) => { resolveAuthReady = resolve })
let unsubscribeAdminDoc = null

// Root admins are the permanent bootstrap fallback (set via NUXT_PUBLIC_ADMIN_EMAILS)
// so the roster stored in Firestore's `admins` collection can never lock everyone out.
export function useAuthState() {
  const config = useRuntimeConfig()
  const rootEmails = config.public.adminEmails
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

  function watchAdminStatus(user) {
    unsubscribeAdminDoc?.()
    unsubscribeAdminDoc = null

    if (!user) {
      isAdmin.value = false
      return
    }
    const email = user.email?.toLowerCase()
    if (rootEmails.includes(email)) {
      isAdmin.value = true
      return
    }
    unsubscribeAdminDoc = onSnapshot(doc(useFirestore(), 'admins', email), (snap) => {
      isAdmin.value = snap.exists()
    })
  }

  function initAuth() {
    if (authInitialized) return
    authInitialized = true
    onAuthStateChanged(useFirebaseAuth(), (user) => {
      currentUser.value = user
      watchAdminStatus(user)
      resolveAuthReady()
    })
  }

  function waitForAuth() {
    return authReady
  }

  async function login() {
    await signInWithPopup(useFirebaseAuth(), new GoogleAuthProvider())
  }

  async function logout() {
    await signOut(useFirebaseAuth())
  }

  return { currentUser, isAdmin, login, logout, initAuth, waitForAuth }
}
