<template>
  <div v-if="book">
    <NuxtLink to="/books" class="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-blue-200 mb-6 transition-colors">
      ← All Books
    </NuxtLink>

    <div class="mb-8">
      <div class="flex items-start gap-3 mb-2 flex-wrap">
        <h1 class="text-3xl font-bold text-blue-50">{{ book.title }}</h1>
        <span v-if="isRead(book.id)" class="mt-1 text-xs bg-violet-900/40 text-violet-300 ring-1 ring-violet-700/40 px-2 py-0.5 rounded">
          Read
        </span>
      </div>
      <p class="text-indigo-400">{{ book.series }} · {{ book.releaseYear }}</p>
    </div>

    <div v-if="!isRead(book.id)" class="bg-surface-800 border border-surface-700 rounded-xl p-8 text-center">
      <p class="text-indigo-300 text-lg mb-1">You haven't read this book yet.</p>
      <p class="text-indigo-500 text-sm">Character details are hidden to avoid spoilers.</p>
    </div>

    <template v-else>
      <div class="flex items-center gap-4 mb-6 flex-wrap">
        <h2 class="text-lg font-semibold text-blue-100 mr-auto">
          Characters
          <span class="text-indigo-400 font-normal text-sm ml-2">{{ filteredAppearances.length }}</span>
        </h2>
        <div class="flex gap-2">
          <button
            v-for="r in roleFilters"
            :key="r.value"
            class="px-3 py-1 rounded-lg text-xs font-medium border transition-colors"
            :class="activeRole === r.value
              ? 'bg-accent-600 border-accent-500 text-white'
              : 'border-surface-600 text-indigo-300 hover:border-indigo-500 hover:text-blue-200'"
            @click="activeRole = activeRole === r.value ? null : r.value"
          >
            {{ r.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NuxtLink
          v-for="{ appearance, character } in filteredAppearances"
          :key="character.id"
          :to="`/characters/${character.id}`"
          class="group flex items-start gap-4 bg-surface-800 border border-surface-700 rounded-xl p-4 hover:border-accent-500/50 hover:bg-surface-700 transition-all"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="font-semibold text-blue-50 group-hover:text-accent-400 transition-colors">
                {{ character.name }}
              </span>
              <span v-if="character.isPoV" class="text-xs text-gold-400 font-medium">PoV</span>
              <RoleBadge :role="appearance.role" />
            </div>
            <p class="text-xs text-indigo-400">{{ character.world }}</p>
            <p class="text-sm text-blue-200 mt-1 line-clamp-2">{{ character.description }}</p>
          </div>
        </NuxtLink>
      </div>
    </template>
  </div>

  <div v-else class="text-indigo-400">Book not found.</div>
</template>

<script setup>
const route = useRoute()
const { books, characters, appearances, load } = useCosmere()
const { isRead } = useReadBooks()
await load()

const book = computed(() => books.value.find(b => b.id === route.params.id))

const roleFilters = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'mentioned', label: 'Mentioned' },
]
const activeRole = ref(null)

const bookAppearances = computed(() =>
  appearances.value
    .filter(a => a.bookId === route.params.id)
    .map(a => ({
      appearance: a,
      character: characters.value.find(c => c.id === a.characterId),
    }))
    .filter(x => x.character)
)

const filteredAppearances = computed(() =>
  activeRole.value
    ? bookAppearances.value.filter(x => x.appearance.role === activeRole.value)
    : bookAppearances.value
)
</script>
