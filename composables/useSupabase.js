import { createClient } from '@supabase/supabase-js'

let _client = null

export function useSupabase() {
  return { client: _client }
}

export function initSupabase(url, key) {
  _client = createClient(url, key)
}
