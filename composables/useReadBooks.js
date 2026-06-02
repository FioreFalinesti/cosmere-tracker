const readSlugs = ref([])
const initialized = ref(false)

export function useReadBooks() {
  async function init() {
    if (initialized.value) return
    const { client } = useSupabase()
    const { data } = await client.from('books').select('slug').eq('read', true)
    if (data) readSlugs.value = data.map(r => r.slug.trim())
    initialized.value = true
  }

  async function toggle(slug) {
    const wasRead = readSlugs.value.includes(slug)
    readSlugs.value = wasRead
      ? readSlugs.value.filter(s => s !== slug)
      : [...readSlugs.value, slug]

    const { client } = useSupabase()
    await client.from('books').update({ read: !wasRead }).eq('slug', slug)
  }

  function isRead(slug) {
    return readSlugs.value.includes(slug)
  }

  return { readSlugs, init, toggle, isRead }
}
