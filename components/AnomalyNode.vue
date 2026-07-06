<template>
  <div :style="{ width: `${data.size}px`, height: `${data.size}px`, userSelect: 'none', cursor: 'pointer' }">
    <AnomalyBlob :size="data.size ?? 60" :color="data.color ?? '#bb88ff'" />
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, required: true },
})
</script>
