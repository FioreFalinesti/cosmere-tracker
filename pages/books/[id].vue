<template>
  <div v-if="book && isBookReached(book.slug)">
    <NuxtLink to="/books" class="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-blue-200 mb-6 transition-colors">
      ← All Books
    </NuxtLink>

    <div class="mb-8">
      <div class="flex items-start gap-3 mb-4 flex-wrap">
        <h1 class="text-3xl font-bold text-blue-50">{{ book.title }}</h1>
      </div>

      <dl class="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
      </dl>
    </div>
  </div>

  <div v-else-if="book" class="text-indigo-400">This book hasn't been reached in your timeline yet.</div>
  <div v-else class="text-indigo-400">Book not found.</div>
</template>

<script setup>
const route = useRoute()
const { books, load } = useCosmere()
const { init: initEvents, isBookReached } = useTimelineEvents()
await load()
await initEvents()

const book = computed(() => books.value.find(b => b.slug === route.params.id))
</script>
