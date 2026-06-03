<template>
  <div class="planet-node">
    <div class="planet-wrap" :style="{ width: `${data.size}px`, height: `${data.size}px` }">
      <div
        class="planet-orb"
        :style="{
          width: `${data.size}px`,
          height: `${data.size}px`,
          background: `radial-gradient(circle at 35% 35%, white 0%, ${data.color} 40%, ${data.colorDark} 100%)`,
          boxShadow: `0 0 ${data.size * 0.3}px ${data.size * 0.08}px ${data.color}33, 0 0 ${data.size * 0.7}px ${data.size * 0.05}px ${data.color}11`,
        }"
      />

      <!-- Name curved along the top — only shown when viewing this system -->
      <svg v-if="showName"
        :width="data.size"
        :height="data.size"
        style="position: absolute; inset: 0; overflow: visible; pointer-events: none;"
      >
        <defs>
          <path :id="pathId" :d="textArcPath" />
        </defs>
        <text fill="white" font-size="8" font-weight="600" text-anchor="middle">
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

// Upper semicircle — minimum curve radius matches size_multiplier=1 (size 16)
const textArcPath = computed(() => {
  const r = Math.max(props.data.size, 16) / 2 + 1
  const cx = props.data.size / 2
  const cy = props.data.size / 2
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
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
