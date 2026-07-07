import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Persist _db/_auth across HMR re-evaluations so they're never null after a hot reload
let _db = import.meta.hot?.data?._db ?? null
let _auth = import.meta.hot?.data?._auth ?? null

export function useFirestore() {
  return _db
}

export function useFirebaseAuth() {
  return _auth
}

export function initFirebase(config) {
  if (_db) return  // Already set — skip re-init (HMR or duplicate plugin call)

  // Reuse the existing Firebase app if initializeApp was already called
  const app = getApps().length ? getApp() : initializeApp(config)
  _db = getFirestore(app)
  _auth = getAuth(app)

  if (import.meta.hot) {
    import.meta.hot.data._db = _db
    import.meta.hot.data._auth = _auth
  }
}
