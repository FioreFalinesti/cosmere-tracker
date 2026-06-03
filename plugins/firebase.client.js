import { initFirebase } from '~/composables/useFirebase'

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
})
