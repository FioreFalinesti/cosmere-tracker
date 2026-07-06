<template>
  <svg :width="size" :height="size" style="overflow: visible; display: block;">
    <defs>
      <filter :id="filterId" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur :stdDeviation="blur" />
      </filter>
    </defs>
    <!-- Distinct lumpy ellipses, lightly softened rather than blurred into a haze -->
    <g :filter="`url(#${filterId})`" :stroke="strokeColor" stroke-width="0.75">
      <ellipse :cx="r"            :cy="r"            :rx="r*0.99" :ry="r*0.79" :fill="color" fill-opacity="0.62" />
      <ellipse :cx="r + r*0.56"  :cy="r - r*0.33"  :rx="r*0.65" :ry="r*0.52" :fill="color" fill-opacity="0.52" />
      <ellipse :cx="r - r*0.47"  :cy="r + r*0.52"  :rx="r*0.70" :ry="r*0.47" :fill="color" fill-opacity="0.48" />
      <ellipse :cx="r + r*0.18"  :cy="r + r*0.61"  :rx="r*0.52" :ry="r*0.42" :fill="color" fill-opacity="0.40" />
      <ellipse :cx="r - r*0.61"  :cy="r - r*0.38"  :rx="r*0.56" :ry="r*0.47" :fill="color" fill-opacity="0.44" />
      <ellipse :cx="r + r*0.47"  :cy="r + r*0.33"  :rx="r*0.42" :ry="r*0.61" :fill="color" fill-opacity="0.36" />
      <ellipse :cx="r - r*0.23"  :cy="r - r*0.65"  :rx="r*0.38" :ry="r*0.30" :fill="color" fill-opacity="0.30" />
      <ellipse :cx="r + r*0.70"  :cy="r + r*0.14"  :rx="r*0.33" :ry="r*0.47" :fill="color" fill-opacity="0.28" />
    </g>
  </svg>
</template>

<script setup>
import { darkenHex } from '~/utils/colorUtils'

// A separate copy of AnomalyBlob's lump layout, tuned to read as a solid
// lumpy mass rather than a hazy cloud (higher opacity, a defining stroke,
// and much less blur) — used for the Dor and other splinter-remnants, kept
// independent so real Anomaly map bodies can keep their current soft look.
const props = defineProps({
  size: { type: Number, default: 60 },
  color: { type: String, default: '#bb88ff' },
})

const filterId = `remnant-glow-${crypto.randomUUID()}`
const r = computed(() => props.size / 2)
const blur = computed(() => Math.max(0.3, props.size * (1.0 / 60)))
const strokeColor = computed(() => darkenHex(props.color, 0.55))
</script>
