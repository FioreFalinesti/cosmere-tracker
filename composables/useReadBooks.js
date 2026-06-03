const STORAGE_KEY = 'cosmere-tracker:read-books'

const readSlugs = ref([])
const initialized = ref(false)

export function useReadBooks() {
  function init() {
    if (initialized.value) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      readSlugs.value = stored ? JSON.parse(stored) : []
    } catch {
      readSlugs.value = []
    }
    initialized.value = true
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readSlugs.value))
  }

  function toggle(slug) {
    const wasRead = readSlugs.value.includes(slug)
    readSlugs.value = wasRead
      ? readSlugs.value.filter(s => s !== slug)
      : [...readSlugs.value, slug]
    save()
  }

  function isRead(slug) {
    return readSlugs.value.includes(slug)
  }

  function selectAll(slugs) {
    readSlugs.value = [...slugs]
    save()
  }

  function unselectAll() {
    readSlugs.value = []
    save()
  }

  return { readSlugs, init, toggle, isRead, selectAll, unselectAll }
}
