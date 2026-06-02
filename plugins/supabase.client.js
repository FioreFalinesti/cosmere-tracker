import { initSupabase } from '~/composables/useSupabase'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  initSupabase(config.public.supabaseUrl, config.public.supabaseKey)
})
