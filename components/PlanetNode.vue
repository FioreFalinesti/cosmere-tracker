<template>
  <div class="planet-node" @click="handleClick">
    <div class="planet-wrap" :style="{ width: `${data.size}px`, height: `${data.size}px` }">

      <!-- Saturn rings — back half (rendered before planet so orb covers the middle) -->
      <svg
        v-if="rings.length"
        :width="data.size"
        :height="data.size"
        style="position: absolute; inset: 0; overflow: visible; pointer-events: none;"
      >
        <path
          v-for="(ring, i) in rings"
          :key="`rb-${i}`"
          :d="`M ${cx - ring.rx} ${cy} A ${ring.rx} ${ring.ry} 0 0 1 ${cx + ring.rx} ${cy}`"
          fill="none"
          :stroke="ring.color"
          :stroke-width="ring.sw"
          stroke-opacity="0.3"
        />
      </svg>

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

      <!-- Saturn rings — front half (rendered after planet so it appears in front) -->
      <svg
        v-if="rings.length"
        :width="data.size"
        :height="data.size"
        style="position: absolute; inset: 0; overflow: visible; pointer-events: none;"
      >
        <path
          v-for="(ring, i) in rings"
          :key="`rf-${i}`"
          :d="`M ${cx - ring.rx} ${cy} A ${ring.rx} ${ring.ry} 0 0 0 ${cx + ring.rx} ${cy}`"
          fill="none"
          :stroke="ring.color"
          :stroke-width="ring.sw"
          stroke-opacity="0.65"
        />
      </svg>

    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

const { viewingSystem, selectedPlanetSlug, selectedSystemSlug, zoomTarget } = useMapState()

function handleClick() {
  selectedPlanetSlug.value = props.id
  selectedSystemSlug.value = null
  zoomTarget.value = { type: 'planet', slug: props.id }
}
const showName = computed(() => viewingSystem.value === props.data.systemSlug)

const pathId = computed(() => `tp-${props.data.name.replace(/\s+/g, '-').toLowerCase()}`)

const cx = computed(() => props.data.size / 2)
const cy = computed(() => props.data.size / 2)

const textArcPath = computed(() => {
  const r = props.data.size / 2 + 1
  return `M ${cx.value - r} ${cy.value} A ${r} ${r} 0 0 1 ${cx.value + r} ${cy.value}`
})

const fontSize = computed(() => {
  const r = props.data.size / 2 + 1
  const available = Math.PI * r
  const needed = props.data.name.length * 0.6 * 8
  if (needed <= available) return 8
  return Math.max(4, Math.floor(available / (props.data.name.length * 0.6)))
})

const RING_COLORS = ['#ffffff', '#cccccc', '#e8e8e8', '#bbbbbb', '#d4d4d4']

const rings = computed(() => {
  const count = props.data.ringCount ?? 0
  if (count <= 0) return []
  const r = props.data.size / 2
  const sw = Math.max(2, r * 0.1)
  return Array.from({ length: count }, (_, i) => {
    const rx = r * (1.28 + i * 0.22)
    return { rx, ry: rx * 0.28, sw, color: RING_COLORS[i % RING_COLORS.length] }
  })
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
