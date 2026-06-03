<template>
  <aside class="w-64 shrink-0 border-r border-surface-700 bg-surface-900 h-full flex flex-col">
    <div class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
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

    <!-- Edit Positions toggle — only relevant on the map page -->
    <div v-if="route.path === '/'" class="shrink-0 border-t border-surface-700 px-4 py-3 flex items-center justify-between">
      <span class="text-xs text-indigo-400">Edit Positions</span>
      <button
        class="relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none"
        :class="editPositions ? 'bg-accent-600' : 'bg-surface-600'"
        @click="editPositions = !editPositions"
      >
        <span
          class="inline-block w-3 h-3 bg-white rounded-full shadow transition-transform"
          :class="editPositions ? 'translate-x-5' : 'translate-x-1'"
        />
      </button>
    </div>
  </aside>
</template>

<script setup>
const { books, load } = useCosmere()
const { init, toggle, isRead } = useReadBooks()
const { editPositions } = useMapState()
const route = useRoute()

await load()
await init()

const sortedBooks = computed(() =>
  [...books.value].sort((a, b) => a.release_order - b.release_order)
)
</script>
