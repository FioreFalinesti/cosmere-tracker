<template>
  <div :style="style" />
</template>

<script setup>
const props = defineProps({
  data: { type: Object, required: true },
})

function blendToWhite(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const m = n => Math.round(n + (255 - n) * amount).toString(16).padStart(2, '0')
  return `#${m(r)}${m(g)}${m(b)}`
}

const style = computed(() => {
  const c = props.data.color ?? '#ff8844'
  const s = props.data.size ?? 8
  const mid = blendToWhite(c, 0.7)
  return {
    width: `${s}px`,
    height: `${s}px`,
    background: `radial-gradient(circle, #ffffff 0%, ${mid} 50%, ${c} 100%)`,
    boxShadow: `0 0 ${s * 1.5}px ${s * 0.5}px ${c}66, 0 0 ${s * 3}px ${s}px ${c}22`,
    borderRadius: '50%',
    pointerEvents: 'none',
    userSelect: 'none',
    cursor: 'default',
  }
})
</script>
