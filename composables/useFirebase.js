import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Persist _db across HMR re-evaluations so it's never null after a hot reload
let _db = import.meta.hot?.data?._db ?? null

export function useFirestore() {
  return _db
}

export function initFirebase(config) {
  if (_db) return  // Already set — skip re-init (HMR or duplicate plugin call)

  // Reuse the existing Firebase app if initializeApp was already called
  const app = getApps().length ? getApp() : initializeApp(config)
  _db = getFirestore(app)

  if (import.meta.hot) {
    import.meta.hot.data._db = _db
  }
}
