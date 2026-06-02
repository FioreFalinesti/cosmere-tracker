import { createClient } from '@supabase/supabase-js'

let _client = null
const _user = shallowRef(null)

export function useSupabase() {
  return { client: _client, user: _user }
}

export async function initSupabase(url, key) {
  _client = createClient(url, key)

  const { data: { session } } = await _client.auth.getSession()
  if (session) {
    _user.value = session.user
  } else {
    const { data } = await _client.auth.signInAnonymously()
    _user.value = data.user
  }
}
