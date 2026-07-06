import type { Ref } from 'vue'

export interface Book {
  slug: string
  title: string
  series: string
  published_on: string
  release_order: number
  planets: string[]
}

export interface Character {
  id: string
  name: string
  world: string
  description: string
  isPoV: boolean
}

export interface Appearance {
  characterId: string
  bookId: string
  role: 'major' | 'minor' | 'mentioned'
}

interface CosmereStore {
  books: Ref<Book[]>
  characters: Ref<Character[]>
  appearances: Ref<Appearance[]>
  initialized: Ref<boolean>
  load: () => Promise<void>
}

const { items: books, initialized, init: initBooksCollection } = firestoreCollectionLoader(BOOKS_COLLECTION, { orderByField: 'release_order' })
const characters = ref<Character[]>([])
const appearances = ref<Appearance[]>([])

export function useCosmere(): CosmereStore {
  async function load() {
    if (initialized.value) return
    await Promise.all([
      initBooksCollection(),
      $fetch<Character[]>('/data/characters.json').then(c => { characters.value = c }),
      $fetch<Appearance[]>('/data/appearances.json').then(a => { appearances.value = a }),
    ])
  }

  return { books, characters, appearances, initialized, load }
}
