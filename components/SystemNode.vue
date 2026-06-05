<template>
  <div class="system-container">
    <div class="system-circle-wrap" :style="{ width: `${data.size}px`, height: `${data.size}px` }">
      <div class="system-circle" :style="circleStyle" />

      <!-- Orbit rings — one per member, styled by type -->
      <svg class="orbit-rings" :width="data.size" :height="data.size">
        <defs>
          <filter v-if="data.starParticulateRing" id="spr-blur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <!-- Binary: secondary star orbit ring (star itself is a separate animated node) -->
        <circle
          v-if="data.isBinary"
          :cx="data.size / 2" :cy="data.size / 2"
          :r="secondaryOrbitR"
          :stroke="data.secondaryStarColor ?? '#ff8844'"
          stroke-opacity="0.28"
          stroke-width="0.75"
          stroke-dasharray="4 4"
          fill="none"
        />

        <!-- Primary star particulate ring — blurred filled rings like the anomaly cloud -->
        <g v-if="starParticulateRings.length" filter="url(#spr-blur)">
          <circle
            v-for="ring in starParticulateRings" :key="`spr-${ring.r}`"
            :cx="data.size / 2" :cy="data.size / 2"
            :r="ring.r"
            fill="none"
            :stroke="data.starColor ?? '#ffcc44'"
            :stroke-opacity="ring.opacity"
            :stroke-width="ring.width"
          />
        </g>

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
          <!-- Star: dashed orbit ring in star color -->
          <circle v-else-if="item.type === 'star'"
            :cx="data.size / 2" :cy="data.size / 2" :r="item.r"
            :stroke="data.secondaryStarColor ?? '#ff8844'"
            stroke-opacity="0.28" stroke-width="0.75" stroke-dasharray="4 4" fill="none" />
          <!-- Anomaly: faint orbit ring -->
          <circle v-else-if="item.type === 'anomaly'"
            :cx="data.size / 2" :cy="data.size / 2" :r="item.r"
            stroke="#cc99ff" stroke-opacity="0.15" stroke-width="0.75" fill="none" />
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

const sunSize = computed(() => Math.floor(Math.max(0.1, props.data.starSize ?? 1) * 64))

const orbitInnerR = computed(() => Math.floor(Math.max(0.1, props.data.starSize ?? 1) * 64) / 2 + 20)

const starParticulateRings = computed(() => {
  if (!props.data.starParticulateRing) return []
  const sr = sunSize.value / 2
  const r = sr * 2.0
  return [
    { r: r * 0.92, opacity: 0.18, width: 14 },
    { r,           opacity: 0.30, width: 22 },
    { r: r * 1.08, opacity: 0.18, width: 14 },
  ]
})

const autoOuterR = computed(() => {
  const n = (props.data.memberTypes ?? []).length
  return orbitInnerR.value + Math.max(80, n * 55)
})

const secondaryOrbitR = computed(() =>
  props.data.isBinary ? (props.data.secondaryStarOrbitDist ?? 0) : 0
)

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
  const lagrangePoints = props.data.memberLagrangePoints ?? []
  const distances = props.data.memberOrbitDistances
  const n = types.length
  if (n === 0) return []
  const innerR = orbitInnerR.value
  const outerR = autoOuterR.value
  return types.map((type, i) => {
    if (lagrangePoints[i]) return null  // no orbit ring for Lagrange-locked planets
    return {
      type,
      r: distances
        ? distances[i]
        : innerR + (outerR - innerR) * (i + 1) / (n + 1),
    }
  }).filter(Boolean)
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

function blendToWhite(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const m = n => Math.round(n + (255 - n) * amount).toString(16).padStart(2, '0')
  return `#${m(r)}${m(g)}${m(b)}`
}

const sunStyle = computed(() => {
  const c = props.data.starColor ?? '#ffcc44'
  const mid = blendToWhite(c, 0.7)
  return {
    width: `${sunSize.value}px`,
    height: `${sunSize.value}px`,
    background: `radial-gradient(circle, #ffffff 0%, ${mid} 50%, ${c} 100%)`,
    boxShadow: `0 0 ${sunSize.value * 1.5}px ${sunSize.value * 0.5}px ${c}66, 0 0 ${sunSize.value * 3}px ${sunSize.value}px ${c}22`,
  }
})
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
