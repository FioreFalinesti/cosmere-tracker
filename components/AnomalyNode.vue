<template>
  <div :style="{ width: `${data.size}px`, height: `${data.size}px`, userSelect: 'none', cursor: 'pointer' }">
    <svg :width="data.size" :height="data.size" style="overflow: visible; pointer-events: none;">
      <defs>
        <filter id="anomaly-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      <!-- Lumpy offset ellipses blurred as a group so edges blend but shapes stay distinct -->
      <g filter="url(#anomaly-glow)">
        <ellipse :cx="r"            :cy="r"            :rx="r*0.42" :ry="r*0.34" :fill="c" fill-opacity="0.32" />
        <ellipse :cx="r + r*0.24"  :cy="r - r*0.14"  :rx="r*0.28" :ry="r*0.22" :fill="c" fill-opacity="0.26" />
        <ellipse :cx="r - r*0.20"  :cy="r + r*0.22"  :rx="r*0.30" :ry="r*0.20" :fill="c" fill-opacity="0.24" />
        <ellipse :cx="r + r*0.08"  :cy="r + r*0.26"  :rx="r*0.22" :ry="r*0.18" :fill="c" fill-opacity="0.20" />
        <ellipse :cx="r - r*0.26"  :cy="r - r*0.16"  :rx="r*0.24" :ry="r*0.20" :fill="c" fill-opacity="0.22" />
        <ellipse :cx="r + r*0.20"  :cy="r + r*0.14"  :rx="r*0.18" :ry="r*0.26" :fill="c" fill-opacity="0.18" />
        <ellipse :cx="r - r*0.10"  :cy="r - r*0.28"  :rx="r*0.16" :ry="r*0.13" :fill="c" fill-opacity="0.15" />
        <ellipse :cx="r + r*0.30"  :cy="r + r*0.06"  :rx="r*0.14" :ry="r*0.20" :fill="c" fill-opacity="0.14" />
      </g>
    </svg>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, required: true },
})
const r = computed(() => (props.data.size ?? 60) / 2)
const c = computed(() => props.data.color ?? '#bb88ff')
</script>
