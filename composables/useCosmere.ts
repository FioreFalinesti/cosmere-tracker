import type { Ref } from 'vue'
import { collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore'

export interface Book {
  slug: string
  title: string
  series: string
  published_on: string
  release_order: number
  read?: boolean
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
    const db = useFirestore()

    const [booksSnap, c, a] = await Promise.all([
      getDocs(query(collection(db, 'books'), orderBy('release_order'))),
      $fetch<Character[]>('/data/characters.json'),
      $fetch<Appearance[]>('/data/appearances.json'),
    ])

    books.value = booksSnap.docs.map(d => ({ slug: d.id, ...d.data() } as Book))
    characters.value = c
    appearances.value = a
    loaded.value = true

    // Real-time updates after initial load
    onSnapshot(
      query(collection(db, 'books'), orderBy('release_order')),
      (snap) => { books.value = snap.docs.map(d => ({ slug: d.id, ...d.data() } as Book)) },
      (err) => console.error('[books snapshot]', err)
    )
  }

  return { books, characters, appearances, loaded, load }
}
