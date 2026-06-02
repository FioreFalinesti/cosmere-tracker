<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
    :class="styles[role]"
  >
    {{ role }}
  </span>
</template>

<script setup lang="ts">
defineProps<{ role: 'major' | 'minor' | 'mentioned' }>()

const styles = {
  major: 'bg-accent-600/20 text-accent-400 ring-1 ring-accent-600/40',
  minor: 'bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/30',
  mentioned: 'bg-indigo-900/40 text-indigo-400 ring-1 ring-indigo-700/40',
}
</script>
