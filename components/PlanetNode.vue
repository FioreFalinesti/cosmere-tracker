<template>
  <div class="planet-node">
    <div class="planet-wrap" :style="{ width: `${data.size}px`, height: `${data.size}px` }">
      <div
        class="planet-orb"
        :style="{
          width: `${data.size}px`,
          height: `${data.size}px`,
          background: data.uninhabited
            ? `radial-gradient(circle at 40% 40%, ${data.color} 0%, ${data.colorDark} 60%, ${data.colorDark} 100%)`
            : `radial-gradient(circle at 35% 35%, white 0%, ${data.color} 40%, ${data.colorDark} 100%)`,
          boxShadow: data.uninhabited
            ? `0 0 ${data.size * 0.15}px ${data.size * 0.04}px ${data.color}22`
            : `0 0 ${data.size * 0.3}px ${data.size * 0.08}px ${data.color}33, 0 0 ${data.size * 0.7}px ${data.size * 0.05}px ${data.color}11`,
        }"
      />

      <!-- Moon orbit rings — shown when viewing this system -->
      <svg
        v-if="showName && data.moonCount > 0"
        :width="data.size"
        :height="data.size"
        style="position: absolute; inset: 0; overflow: visible; pointer-events: none;"
      >
        <circle
          v-for="i in data.moonCount"
          :key="i"
          :cx="data.size / 2"
          :cy="data.size / 2"
          :r="data.size / 2 + 40 + (i - 1) * 30"
          stroke="white"
          stroke-opacity="0.12"
          stroke-width="0.75"
          fill="none"
        />
      </svg>

      <!-- Name curved along the top — only shown when viewing this system -->
      <svg v-if="showName"
        :width="data.size"
        :height="data.size"
        style="position: absolute; inset: 0; overflow: visible; pointer-events: none;"
      >
        <defs>
          <path :id="pathId" :d="textArcPath" />
        </defs>
        <text fill="white" :font-size="fontSize" font-weight="600" text-anchor="middle">
          <textPath :href="`#${pathId}`" startOffset="50%">{{ data.name }}</textPath>
        </text>
      </svg>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

const { viewingSystem } = useMapState()
const showName = computed(() => viewingSystem.value === props.data.systemSlug)

// Unique path ID per planet to avoid SVG defs collisions
const pathId = computed(() => `tp-${props.data.name.replace(/\s+/g, '-').toLowerCase()}`)

const textArcPath = computed(() => {
  const r = props.data.size / 2 + 1
  const cx = props.data.size / 2
  const cy = props.data.size / 2
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
})

// Scale font down so text always fits within the semicircle arc (πr)
const fontSize = computed(() => {
  const r = props.data.size / 2 + 1
  const available = Math.PI * r
  const needed = props.data.name.length * 0.6 * 8  // estimate at 8px
  if (needed <= available) return 8
  return Math.max(4, Math.floor(available / (props.data.name.length * 0.6)))
})
</script>

<style scoped>
.planet-node {
  cursor: pointer;
  user-select: none;
}

.planet-wrap {
  position: relative;
  flex-shrink: 0;
}

.planet-orb {
  border-radius: 50%;
  position: absolute;
  inset: 0;
  transition: box-shadow 0.2s ease;
}
</style>
