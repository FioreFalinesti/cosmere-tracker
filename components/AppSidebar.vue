<template>
  <aside class="w-64 shrink-0 border-r border-surface-700 bg-surface-900 h-full flex flex-col overflow-y-auto">
    <div class="px-3 py-4 space-y-0.5">
      <div
        v-for="book in sortedBooks"
        :key="book.slug"
        class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-700 transition-colors group"
      >
        <input
          type="checkbox"
          :checked="isRead(book.slug)"
          class="shrink-0 w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer"
          @change="toggle(book.slug)"
        />
        <NuxtLink
          :to="`/books/${book.slug}`"
          class="flex-1 text-sm truncate transition-colors"
          :class="isRead(book.slug) ? 'text-blue-100' : 'text-indigo-500 group-hover:text-indigo-300'"
          active-class="text-accent-400"
        >
          {{ book.title }}
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>

<script setup>
const { books, load } = useCosmere()
const { init, toggle, isRead } = useReadBooks()

await load()
await init()

const sortedBooks = computed(() =>
  [...books.value].sort((a, b) => a.release_order - b.release_order)
)
</script>
