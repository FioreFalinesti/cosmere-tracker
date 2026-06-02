<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-blue-50 mb-1">Characters</h1>
      <p class="text-indigo-400 text-sm">{{ characters.length }} characters across the Cosmere</p>
    </div>

    <div class="relative mb-6">
      <input
        v-model="query"
        type="text"
        placeholder="Search by name or description…"
        class="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 pl-10 text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
      />
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NuxtLink
        v-for="character in displayedCharacters"
        :key="character.id"
        :to="`/characters/${character.id}`"
        class="group flex flex-col bg-surface-800 border border-surface-700 rounded-xl p-4 hover:border-accent-500/50 hover:bg-surface-700 transition-all"
      >
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span class="font-semibold text-blue-50 group-hover:text-accent-400 transition-colors">
            {{ character.name }}
          </span>
          <span v-if="character.isPoV" class="text-xs text-gold-400 font-medium">PoV</span>
        </div>
        <p class="text-xs text-indigo-400 mb-2">{{ character.world }}</p>
        <p class="text-sm text-blue-200 line-clamp-2 mb-3">{{ character.description }}</p>
        <div class="flex flex-wrap gap-1.5 mt-auto">
          <NuxtLink
            v-for="entry in readBooksFor(character.id)"
            :key="entry.book.id"
            :to="`/books/${entry.book.id}`"
            class="text-xs bg-surface-700 hover:bg-surface-600 text-indigo-300 hover:text-blue-100 px-2 py-0.5 rounded transition-colors"
            @click.stop
          >
            {{ entry.book.title }}
          </NuxtLink>
          <span
            v-if="unreadBooksFor(character.id) > 0"
            class="text-xs text-indigo-600 italic px-1"
          >
            +{{ unreadBooksFor(character.id) }} unread
          </span>
        </div>
      </NuxtLink>
    </div>

    <p v-if="displayedCharacters.length === 0" class="text-indigo-400 text-center py-12">
      No characters match "{{ query }}"
    </p>
  </div>
</template>

<script setup>
import Fuse from 'fuse.js'

const { characters, books, appearances, load } = useCosmere()
const { isRead } = useReadBooks()
await load()

const query = ref('')

const fuse = computed(() =>
  new Fuse(characters.value, {
    keys: ['name', 'description'],
    threshold: 0.35,
  })
)

const displayedCharacters = computed(() => {
  if (!query.value.trim()) return characters.value
  return fuse.value.search(query.value).map(r => r.item)
})

function readBooksFor(characterId) {
  return appearances.value
    .filter(a => a.characterId === characterId)
    .map(a => ({ book: books.value.find(b => b.id === a.bookId) }))
    .filter(x => x.book && isRead(x.book.id))
}

function unreadBooksFor(characterId) {
  return appearances.value
    .filter(a => a.characterId === characterId)
    .filter(a => {
      const book = books.value.find(b => b.id === a.bookId)
      return book && !isRead(book.id)
    }).length
}
</script>
