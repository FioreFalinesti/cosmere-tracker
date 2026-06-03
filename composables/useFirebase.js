import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

let _db = null

export function useFirestore() {
  return _db
}

export function initFirebase(config) {
  const app = initializeApp(config)
  _db = getFirestore(app)
}
