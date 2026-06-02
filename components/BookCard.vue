<template>
  <NuxtLink
    :to="`/books/${book.slug}`"
    class="group block bg-surface-800 border border-surface-700 rounded-xl p-5 hover:border-accent-500/50 hover:bg-surface-700 transition-all duration-200"
  >
    <div class="flex items-start justify-between gap-2 mb-2">
      <h3 class="font-semibold text-blue-50 group-hover:text-accent-400 transition-colors leading-tight">
        {{ book.title }}
      </h3>
      <span v-if="isRead(book.slug)" class="shrink-0 text-xs bg-violet-900/40 text-violet-300 ring-1 ring-violet-700/40 px-2 py-0.5 rounded">
        Read
      </span>
    </div>
    <p class="text-xs text-indigo-400 mb-3">{{ book.series }} · {{ book.published_on?.slice(0, 4) }}</p>
    <p class="text-sm text-blue-200">
      <span v-if="isRead(book.slug)" class="font-medium text-blue-100">{{ characterCount }}</span>
      <span v-else class="italic text-indigo-500">Unread</span>
      <span v-if="isRead(book.slug)"> character{{ characterCount !== 1 ? 's' : '' }}</span>
    </p>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  book: { type: Object, required: true },
  characterCount: { type: Number, required: true },
})

const { isRead } = useReadBooks()
</script>
