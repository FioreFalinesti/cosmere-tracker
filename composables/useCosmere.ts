import type { Ref } from 'vue'

export interface Book {
  slug: string
  title: string
  series: string
  published_on: string
  release_order: number
  planets: string[]
}

interface CosmereStore {
  books: Ref<Book[]>
  initialized: Ref<boolean>
  load: () => Promise<void>
}

const { items: books, initialized, init: initBooksCollection } = firestoreCollectionLoader(BOOKS_COLLECTION, { orderByField: 'release_order' })

export function useCosmere(): CosmereStore {
  async function load() {
    if (initialized.value) return
    await initBooksCollection()
  }

  return { books, initialized, load }
}
