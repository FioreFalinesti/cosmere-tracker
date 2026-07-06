<template>
  <div v-if="book && isBookReached(book.slug)">
    <NuxtLink to="/books" class="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-blue-200 mb-6 transition-colors">
      ← All Books
    </NuxtLink>

    <div class="mb-8">
      <div class="flex items-start gap-3 mb-4 flex-wrap">
        <h1 class="text-3xl font-bold text-blue-50">{{ book.title }}</h1>
      </div>

      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3">
          <dt class="text-xs text-indigo-500 uppercase tracking-widest mb-1">Published</dt>
          <dd class="text-sm font-medium text-blue-100">{{ formatDate(book.published_on) }}</dd>
        </div>
        <div class="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3">
          <dt class="text-xs text-indigo-500 uppercase tracking-widest mb-1">Series</dt>
          <dd class="text-sm font-medium text-blue-100">{{ book.series }}</dd>
        </div>
        <div class="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3">
          <dt class="text-xs text-indigo-500 uppercase tracking-widest mb-1">Cosmere #</dt>
          <dd class="text-sm font-medium text-blue-100">{{ book.release_order }}</dd>
        </div>
        <div class="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3">
          <dt class="text-xs text-indigo-500 uppercase tracking-widest mb-1">Characters</dt>
          <dd class="text-sm font-medium text-blue-100">{{ bookAppearances.length }}</dd>
        </div>
      </dl>
    </div>

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
  </div>

  <div v-else class="text-indigo-400">Book not found.</div>
</template>

<script setup>
const route = useRoute()
const { books, characters, appearances, load } = useCosmere()
const { init: initEvents, isBookReached } = useTimelineEvents()
await load()
await initEvents()

const book = computed(() => books.value.find(b => b.slug === route.params.id))

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
