import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { useFirebaseAuth } from './useFirebase'

const currentUser = ref(null)
let authInitialized = false

export function useAuthState() {
  const config = useRuntimeConfig()
  const adminEmails = config.public.adminEmails
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

  const isAdmin = computed(() =>
    !!currentUser.value && adminEmails.includes(currentUser.value.email?.toLowerCase())
  )

  function initAuth() {
    if (authInitialized) return
    authInitialized = true
    onAuthStateChanged(useFirebaseAuth(), (user) => { currentUser.value = user })
  }

  async function login() {
    await signInWithPopup(useFirebaseAuth(), new GoogleAuthProvider())
  }

  async function logout() {
    await signOut(useFirebaseAuth())
  }

  return { currentUser, isAdmin, login, logout, initAuth }
}
