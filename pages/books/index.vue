<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-blue-50 mb-1">The Cosmere</h1>
      <p class="text-indigo-400 text-sm">{{ revealedBooks.length }} books revealed so far</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <BookCard
        v-for="book in revealedBooks"
        :key="book.slug"
        :book="book"
        :character-count="characterCountFor(book.slug)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const { books, appearances, load } = useCosmere()
const { init: initEvents, isBookReached } = useTimelineEvents()
await load()
await initEvents()

const revealedBooks = computed(() => books.value.filter(b => isBookReached(b.slug)))

function characterCountFor(bookId: string) {
  return appearances.value.filter(a => a.bookId === bookId).length
}
</script>
