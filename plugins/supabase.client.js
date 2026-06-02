import { initSupabase } from '~/composables/useSupabase'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  await initSupabase(config.public.supabaseUrl, config.public.supabaseKey)
})
