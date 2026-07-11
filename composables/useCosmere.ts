import type { Ref } from 'vue'

export interface Book {
  slug: string
  title: string
  series: string
  published_on: string
  release_order: number
  planets: string[]
  icon: string | null
}

interface CosmereStore {
  books: Ref<Book[]>
  initialized: Ref<boolean>
  load: () => Promise<void>
  setBookIcon: (slug: string, icon: string) => Promise<void>
}

const { items: books, initialized, init: initBooksCollection } = firestoreCollectionLoader(BOOKS_COLLECTION, { orderByField: 'release_order' })

const setBookIcon = makeFieldSetter(books, BOOKS_COLLECTION, 'icon', v => v || null)

export function useCosmere(): CosmereStore {
  async function load() {
    if (initialized.value) return
    await initBooksCollection()
  }

  return { books, initialized, load, setBookIcon }
}
