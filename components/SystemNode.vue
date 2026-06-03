<template>
  <div class="system-container">
    <div class="system-circle-wrap" :style="{ width: `${data.size}px`, height: `${data.size}px` }">
      <div class="system-circle" :style="circleStyle" />

      <!-- Orbit rings — one per member, styled by type -->
      <svg class="orbit-rings" :width="data.size" :height="data.size">
        <template v-for="(item, i) in orbitItems" :key="i">
          <!-- Planet orbit: thin white line -->
          <circle v-if="item.type === 'planet'"
            :cx="data.size / 2" :cy="data.size / 2" :r="item.r"
            stroke="white" stroke-opacity="0.18" stroke-width="0.75" fill="none" />
          <!-- Asteroid belt: 12 rings with density falloff at edges -->
          <template v-else-if="item.type === 'asteroid_belt'">
            <circle
              v-for="(ring, ri) in beltRings" :key="ri"
              :cx="data.size / 2" :cy="data.size / 2"
              :r="item.r + ring.dr"
              :stroke="ring.color"
              :stroke-opacity="ring.opacity"
              :stroke-width="ring.width"
              :stroke-dasharray="ring.dash"
              stroke-linecap="round"
              fill="none"
            />
          </template>
          <!-- Comet belt: 5 rings, light blue tones, spaced dots -->
          <template v-else-if="item.type === 'comet_belt'">
            <circle v-for="(ring, ri) in cometRings" :key="ri"
              :cx="data.size / 2" :cy="data.size / 2"
              :r="item.r + ring.dr"
              :stroke="ring.color"
              :stroke-opacity="ring.opacity"
              :stroke-width="ring.width"
              :stroke-dasharray="ring.dash"
              stroke-linecap="round"
              fill="none"
            />
          </template>
        </template>
      </svg>

      <div class="system-sun" :style="sunStyle" />
    </div>
    <p class="system-label" :style="{ color: `${data.color}aa` }">{{ data.name }}</p>
    <p v-if="data.starName" class="star-label" :style="{ color: `${data.color}66` }">{{ data.starName }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

const sunSize = computed(() => Math.max(6, Math.round(props.data.size * 0.08)))

// 5 rings for comet belt — light blues, r-10 to r+10, widely spaced dots
const cometRings = [
  { dr: -50, color: '#60b8f0', opacity: 0.18, width: 4,   dash: '3 30' },
  { dr: -25, color: '#80ccff', opacity: 0.28, width: 6,   dash: '4 26' },
  { dr:   0, color: '#a0ddff', opacity: 0.38, width: 8,   dash: '5 22' },
  { dr:  25, color: '#80ccff', opacity: 0.28, width: 6,   dash: '4 26' },
  { dr:  50, color: '#60b8f0', opacity: 0.18, width: 4,   dash: '3 30' },
]

// 12 concentric rings spanning r-25 to r+25 with varied dark brown/grey tones
const beltRings = [
  { dr: -50, color: '#2a2418', opacity: 0.08, width: 1,   dash: '1 16' },
  { dr: -44, color: '#352c20', opacity: 0.13, width: 1.5, dash: '1 13' },
  { dr: -38, color: '#4a3828', opacity: 0.20, width: 2,   dash: '1 11' },
  { dr: -32, color: '#3d3535', opacity: 0.26, width: 2.5, dash: '1 8'  },
  { dr: -26, color: '#5a4230', opacity: 0.31, width: 3,   dash: '1 7'  },
  { dr: -20, color: '#4a4040', opacity: 0.35, width: 3.5, dash: '2 6'  },
  { dr: -14, color: '#5e4838', opacity: 0.39, width: 3.5, dash: '1 5'  },
  { dr:  -8, color: '#664535', opacity: 0.42, width: 4,   dash: '2 4'  },
  { dr:  -3, color: '#5a4838', opacity: 0.44, width: 4.5, dash: '1 3'  },
  { dr:   2, color: '#6b5030', opacity: 0.45, width: 5,   dash: '2 3'  },
  { dr:   7, color: '#5a4838', opacity: 0.44, width: 4.5, dash: '1 3'  },
  { dr:  12, color: '#664040', opacity: 0.42, width: 4,   dash: '2 4'  },
  { dr:  18, color: '#504540', opacity: 0.38, width: 3.5, dash: '1 5'  },
  { dr:  24, color: '#4a4030', opacity: 0.33, width: 3,   dash: '2 6'  },
  { dr:  30, color: '#3e3028', opacity: 0.28, width: 2.5, dash: '1 7'  },
  { dr:  36, color: '#484035', opacity: 0.22, width: 2,   dash: '1 9'  },
  { dr:  42, color: '#352e25', opacity: 0.15, width: 1.5, dash: '1 12' },
  { dr:  46, color: '#302820', opacity: 0.11, width: 1,   dash: '1 14' },
  { dr:  49, color: '#2a2418', opacity: 0.07, width: 1,   dash: '1 16' },
  { dr:  50, color: '#201c14', opacity: 0.05, width: 1,   dash: '1 18' },
]

// Build one orbit entry per member (planet or body), evenly spaced
const orbitItems = computed(() => {
  const types = props.data.memberTypes ?? Array(props.data.planetCount ?? 0).fill('planet')
  const n = types.length
  if (n === 0) return []
  const innerR = sunSize.value / 2 + 4
  const outerR = props.data.size / 2 - 6
  return types.map((type, i) => ({
    type,
    r: innerR + (outerR - innerR) * (i + 1) / (n + 1),
  }))
})

const circleStyle = computed(() => ({
  width: '100%',
  height: '100%',
  background: `radial-gradient(circle, #07091a 0%, #020308 100%)`,
  border: `2px solid ${props.data.color}55`,
  boxShadow: [
    `0 0 ${props.data.size * 0.35}px ${props.data.size * 0.06}px ${props.data.color}33`,
    `0 0 ${props.data.size * 0.12}px ${props.data.color}66`,
    `inset 0 0 ${props.data.size * 0.25}px ${props.data.color}0d`,
  ].join(', '),
}))

const sunStyle = computed(() => ({
  width: `${sunSize.value}px`,
  height: `${sunSize.value}px`,
  background: `radial-gradient(circle, #ffffff 0%, #fff5c0 50%, #ffcc44 100%)`,
  boxShadow: `0 0 ${sunSize.value * 1.5}px ${sunSize.value * 0.5}px #ffcc4466, 0 0 ${sunSize.value * 3}px ${sunSize.value}px #ffcc4422`,
}))
</script>

<style scoped>
.system-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.system-circle-wrap {
  position: relative;
  flex-shrink: 0;
}

.system-circle {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.orbit-rings {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.system-sun {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.system-label {
  font-size: 32px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.2;
  text-align: center;
}

.star-label {
  font-size: 9px;
  letter-spacing: 0.04em;
  line-height: 1.2;
  text-align: center;
  margin-top: -6px;
}
</style>
