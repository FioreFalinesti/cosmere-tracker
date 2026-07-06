<template>
  <div v-if="character">
    <NuxtLink to="/characters" class="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-blue-200 mb-6 transition-colors">
      ← All Characters
    </NuxtLink>

    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2 flex-wrap">
        <h1
          class="text-3xl font-bold"
          :class="character.name === 'unknown' ? 'text-indigo-500 italic font-normal' : 'text-blue-50'"
        >{{ character.name }}</h1>
        <span v-if="character.isPoV" class="text-sm text-gold-400 font-medium">PoV Character</span>
      </div>
      <p class="text-indigo-400 text-sm mb-4">{{ character.world }}</p>
      <p class="text-blue-200 leading-relaxed max-w-2xl">{{ character.description }}</p>
    </div>

    <h2 class="text-lg font-semibold text-blue-100 mb-4">
      Appearances
      <span class="text-indigo-400 font-normal text-sm ml-2">{{ allAppearances.length }} book{{ allAppearances.length !== 1 ? 's' : '' }}</span>
    </h2>

    <div class="flex flex-col gap-3">
      <NuxtLink
        v-for="{ book, appearance } in allAppearances"
        :key="book.slug"
        :to="`/books/${book.slug}`"
        class="group flex items-center justify-between bg-surface-800 border border-surface-700 rounded-xl px-5 py-4 hover:border-accent-500/50 hover:bg-surface-700 transition-all"
      >
        <div>
          <p class="font-medium text-blue-50 group-hover:text-accent-400 transition-colors">{{ book.title }}</p>
          <p class="text-sm text-indigo-400">{{ book.series }} · {{ book.published_on.slice(0, 4) }}</p>
        </div>
        <RoleBadge :role="appearance.role" />
      </NuxtLink>
    </div>
  </div>

  <div v-else class="text-indigo-400">Character not found.</div>
</template>

<script setup>
const route = useRoute()
const { characters, books, appearances, load } = useCosmere()
const { events: timelineEvents, init: initEvents, isReached } = useTimelineEvents()
await load()
await initEvents()

function isBookReached(bookSlug) {
  return timelineEvents.value.some(ev => ev.book_slug === bookSlug && isReached(ev))
}

const character = computed(() => characters.value.find(c => c.id === route.params.id))

// Only the books reached so far — a character navigated to directly (e.g. a
// bookmark) shouldn't have their future appearances spoiled here either.
const allAppearances = computed(() =>
  appearances.value
    .filter(a => a.characterId === route.params.id && isBookReached(a.bookId))
    .map(a => ({
      appearance: a,
      book: books.value.find(b => b.slug === a.bookId),
    }))
    .filter(x => x.book)
    .sort((a, b) => a.book.release_order - b.book.release_order)
)
</script>
