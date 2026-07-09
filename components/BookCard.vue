<template>
  <NuxtLink
    :to="`/books/${book.slug}`"
    class="group block bg-surface-800 border border-surface-700 rounded-xl p-5 hover:border-accent-500/50 hover:bg-surface-700 transition-all duration-200"
  >
    <div class="flex items-start justify-between gap-2 mb-2">
      <h3 class="font-semibold text-blue-50 group-hover:text-accent-400 transition-colors leading-tight">
        {{ book.title }}
      </h3>
    </div>
    <p class="text-xs text-indigo-400">{{ book.series }} · {{ book.published_on?.slice(0, 4) }}</p>
  </NuxtLink>
</template>

<script setup>
defineProps({
  book: { type: Object, required: true },
})
</script>
