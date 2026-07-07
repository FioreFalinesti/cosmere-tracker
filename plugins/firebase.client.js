import { initFirebase } from '~/composables/useFirebase'
import { useAuthState } from '~/composables/useAuthState'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  initFirebase({
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
  })
  useAuthState().initAuth()
})
