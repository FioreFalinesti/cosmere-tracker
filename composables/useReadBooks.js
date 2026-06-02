const readIds = ref(new Set())
const initialized = ref(false)

export function useReadBooks() {
  async function init() {
    if (initialized.value) return
    const { client } = useSupabase()
    const { data } = await client.from('user_books').select('book_id').eq('read', true)
    if (data) readIds.value = new Set(data.map(r => r.book_id))
    initialized.value = true
  }

  async function toggle(bookId) {
    const wasRead = readIds.value.has(bookId)
    const next = new Set(readIds.value)
    if (wasRead) next.delete(bookId)
    else next.add(bookId)
    readIds.value = next

    const { client, user } = useSupabase()
    await client.from('user_books').upsert(
      { user_id: user.value.id, book_id: bookId, read: !wasRead },
      { onConflict: 'user_id,book_id' }
    )
  }

  function isRead(bookId) {
    return readIds.value.has(bookId)
  }

  return { readIds, init, toggle, isRead }
}
