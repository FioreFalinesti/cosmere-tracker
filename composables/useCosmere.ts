import type { Ref } from 'vue'

export interface Book {
  slug: string
  title: string
  series: string
  published_on: string
  release_order: number
  read: boolean
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
  loaded: Ref<boolean>
  load: () => Promise<void>
}

const books = ref<Book[]>([])
const characters = ref<Character[]>([])
const appearances = ref<Appearance[]>([])
const loaded = ref(false)

export function useCosmere(): CosmereStore {
  async function load() {
    if (loaded.value) return
    const { client } = useSupabase()
    const [{ data: booksData }, c, a] = await Promise.all([
      client.from('books').select('*').order('release_order'),
      $fetch<Character[]>('/data/characters.json'),
      $fetch<Appearance[]>('/data/appearances.json'),
    ])
    books.value = (booksData ?? []).map(b => ({ ...b, slug: b.slug?.trim() }))
    characters.value = c
    appearances.value = a
    loaded.value = true
  }

  return { books, characters, appearances, loaded, load }
}
