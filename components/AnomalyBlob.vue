<template>
  <svg :width="size" :height="size" style="overflow: visible; display: block;">
    <defs>
      <filter :id="filterId" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur :stdDeviation="blur" />
      </filter>
    </defs>
    <!-- Lumpy offset ellipses blurred as a group so edges blend but shapes stay distinct -->
    <g :filter="`url(#${filterId})`">
      <ellipse :cx="r"            :cy="r"            :rx="r*0.42" :ry="r*0.34" :fill="color" fill-opacity="0.32" />
      <ellipse :cx="r + r*0.24"  :cy="r - r*0.14"  :rx="r*0.28" :ry="r*0.22" :fill="color" fill-opacity="0.26" />
      <ellipse :cx="r - r*0.20"  :cy="r + r*0.22"  :rx="r*0.30" :ry="r*0.20" :fill="color" fill-opacity="0.24" />
      <ellipse :cx="r + r*0.08"  :cy="r + r*0.26"  :rx="r*0.22" :ry="r*0.18" :fill="color" fill-opacity="0.20" />
      <ellipse :cx="r - r*0.26"  :cy="r - r*0.16"  :rx="r*0.24" :ry="r*0.20" :fill="color" fill-opacity="0.22" />
      <ellipse :cx="r + r*0.20"  :cy="r + r*0.14"  :rx="r*0.18" :ry="r*0.26" :fill="color" fill-opacity="0.18" />
      <ellipse :cx="r - r*0.10"  :cy="r - r*0.28"  :rx="r*0.16" :ry="r*0.13" :fill="color" fill-opacity="0.15" />
      <ellipse :cx="r + r*0.30"  :cy="r + r*0.06"  :rx="r*0.14" :ry="r*0.20" :fill="color" fill-opacity="0.14" />
    </g>
  </svg>
</template>

<script setup>
// Shared lumpy-cloud "anomaly" visual — used both by the full-size AnomalyNode
// map body and by small map badges (e.g. a splinter-remnant like the Dor).
const props = defineProps({
  size: { type: Number, default: 60 },
  color: { type: String, default: '#bb88ff' },
})

// A plain counter here would reset to 0 on every instance since <script
// setup> top-level code re-runs per component instance — use a random id
// instead so multiple AnomalyBlobs on the page never collide on the same
// SVG filter id (which would make them silently borrow each other's blur).
const filterId = `anomaly-glow-${crypto.randomUUID()}`
const r = computed(() => props.size / 2)
// Blur was tuned at stdDeviation 3.5 for the default 60px size — scale it down
// for smaller badge-sized instances so the shape doesn't dissolve into mush.
const blur = computed(() => Math.max(0.6, props.size * (3.5 / 60)))
</script>
