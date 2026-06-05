<template>
  <div style="position: relative; line-height: 0;">
    <div :style="starStyle" />
    <svg v-if="data.particulateRing && particulateRings.length"
      :width="data.size" :height="data.size"
      style="position: absolute; inset: 0; overflow: visible; pointer-events: none;">
      <defs>
        <filter id="sec-spr-blur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <g filter="url(#sec-spr-blur)">
        <circle
          v-for="ring in particulateRings" :key="ring.r"
          :cx="data.size / 2" :cy="data.size / 2"
          :r="ring.r"
          :stroke="data.color ?? '#ff8844'"
          :stroke-opacity="ring.opacity"
          :stroke-width="ring.width"
          fill="none"
        />
      </g>
    </svg>
  </div>
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

const starStyle = computed(() => {
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

const particulateRings = computed(() => {
  if (!props.data.particulateRing) return []
  const sr = (props.data.size ?? 8) / 2
  const r = sr * 2.0
  return [
    { r: r * 0.92, opacity: 0.18, width: 14 },
    { r,           opacity: 0.30, width: 22 },
    { r: r * 1.08, opacity: 0.18, width: 14 },
  ]
})
</script>
