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
          :transform="ring.tilt ? `rotate(${ring.tilt}, ${cx}, ${cy})` : undefined"
        />
      </svg>

      <!-- Gas giant SVG orb with swirly banded texture -->
      <svg
        v-if="data.isGasGiant"
        class="planet-orb"
        :width="data.size"
        :height="data.size"
        :style="{
          overflow: 'hidden',
          boxShadow: `0 0 ${data.size * 0.3}px ${data.size * 0.08}px ${data.color}33, 0 0 ${data.size * 0.7}px ${data.size * 0.05}px ${data.color}11`,
        }"
      >
        <defs>
          <clipPath :id="`gc-${pathId}`">
            <circle :cx="data.size / 2" :cy="data.size / 2" :r="data.size / 2" />
          </clipPath>
          <radialGradient :id="`gl-${pathId}`" cx="35%" cy="35%" r="70%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stop-color="white" stop-opacity="0.40" />
            <stop offset="40%"  stop-color="white" stop-opacity="0" />
            <stop offset="100%" stop-color="black" stop-opacity="0.42" />
          </radialGradient>
        </defs>
        <g :clip-path="`url(#gc-${pathId})`">
          <rect x="0" y="0" :width="data.size" :height="data.size" :fill="data.color" />
          <g :transform="`rotate(${gasGiant.angle}, ${data.size / 2}, ${data.size / 2})`">
            <path v-for="(band, i) in gasGiant.bands" :key="i" :d="band.d" :fill="band.color" />
          </g>
          <ellipse
            :cx="data.size / 2" :cy="data.size / 2"
            :rx="data.size / 2" :ry="data.size / 2"
            :fill="`url(#gl-${pathId})`"
          />
        </g>
      </svg>

      <!-- Dwarf planet SVG orb with rocky/icy texture -->
      <svg
        v-else-if="data.isDwarfPlanet"
        class="planet-orb"
        :width="data.size"
        :height="data.size"
        :style="{
          overflow: 'hidden',
          boxShadow: `0 0 ${data.size * 0.15}px ${data.size * 0.04}px ${dwarfPlanet.adjustedColor}33`,
        }"
      >
        <defs>
          <clipPath :id="`dc-${pathId}`">
            <circle :cx="data.size / 2" :cy="data.size / 2" :r="data.size / 2" />
          </clipPath>
          <radialGradient :id="`dl-${pathId}`" cx="35%" cy="35%" r="70%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stop-color="white" stop-opacity="0.30" />
            <stop offset="40%"  stop-color="white" stop-opacity="0" />
            <stop offset="100%" stop-color="black" stop-opacity="0.55" />
          </radialGradient>
        </defs>
        <g :clip-path="`url(#dc-${pathId})`">
          <rect x="0" y="0" :width="data.size" :height="data.size" :fill="dwarfPlanet.baseColor" />
          <ellipse
            v-for="(p, i) in dwarfPlanet.patches"
            :key="`p-${i}`"
            :cx="p.x" :cy="p.y" :rx="p.rx" :ry="p.ry"
            :fill="p.color" :opacity="p.opacity"
            :transform="`rotate(${p.rot}, ${p.x}, ${p.y})`"
          />
          <circle
            v-for="(c, i) in dwarfPlanet.craters"
            :key="`c-${i}`"
            :cx="c.x" :cy="c.y" :r="c.r"
            :fill="c.color"
          />
          <ellipse
            :cx="data.size / 2" :cy="data.size / 2"
            :rx="data.size / 2" :ry="data.size / 2"
            :fill="`url(#dl-${pathId})`"
          />
        </g>
      </svg>

      <!-- Regular planet orb -->
      <div
        v-else
        class="planet-orb"
        :style="{
          width: `${data.size}px`,
          height: `${data.size}px`,
          background: `radial-gradient(circle at 40% 40%, ${orbColor} 0%, ${orbColorDark} 60%, ${orbColorDark} 100%)`,
          boxShadow: `0 0 ${data.size * 0.15}px ${data.size * 0.04}px ${orbColor}22`,
        }"
      />

      <!-- Moon orbit rings — shown when viewing this system -->
      <svg
        v-if="showName && data.moonOrbits?.length"
        :width="data.size"
        :height="data.size"
        style="position: absolute; inset: 0; overflow: visible; pointer-events: none;"
      >
        <template v-for="(moon, mi) in data.moonOrbits" :key="mi">
          <line v-if="moon.orbitType === 'polar'"
            :x1="cx + moon.orbitR * polarLineDir.cos" :y1="cy + moon.orbitR * polarLineDir.sin"
            :x2="cx - moon.orbitR * polarLineDir.cos" :y2="cy - moon.orbitR * polarLineDir.sin"
            stroke="white" stroke-opacity="0.03" stroke-width="0.75" />
          <ellipse v-else-if="moon.orbitType === 'eccentric-a'"
            :cx="cx" :cy="cy" :rx="moon.orbitR" :ry="moon.orbitR * 0.45"
            :transform="`rotate(${(moon.orbitRotation * 180 / Math.PI).toFixed(1)}, ${cx}, ${cy})`"
            stroke="white" stroke-opacity="0.03" stroke-width="0.75" fill="none" />
          <circle v-else-if="moon.orbitType === 'eccentric-c'"
            :cx="cx + moon.orbitR * 0.4 * Math.cos(moon.orbitRotation)"
            :cy="cy + moon.orbitR * 0.4 * Math.sin(moon.orbitRotation)"
            :r="moon.orbitR"
            stroke="white" stroke-opacity="0.03" stroke-width="0.75" fill="none" />
          <circle v-else
            :cx="cx" :cy="cy" :r="moon.orbitR"
            stroke="white" stroke-opacity="0.03" stroke-width="0.75" fill="none" />
        </template>
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
          :transform="ring.tilt ? `rotate(${ring.tilt}, ${cx}, ${cy})` : undefined"
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

const { viewingSystem, selectedPlanetSlug, selectedSystemSlug, zoomTarget, polarOrbitAngles } = useMapState()

const polarLineDir = computed(() => {
  const a = polarOrbitAngles[props.id] ?? (-Math.PI / 2)
  return { cos: Math.cos(a), sin: Math.sin(a) }
})

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

// ── Planet orb color ─────────────────────────────────────────────────────────

function desaturateHex(hex, amount = 0.65) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  const h = n => Math.round(n + (gray - n) * amount).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

const orbColor = computed(() =>
  props.data.uninhabited ? desaturateHex(props.data.color) : props.data.color
)
const orbColorDark = computed(() =>
  props.data.uninhabited ? desaturateHex(props.data.colorDark) : props.data.colorDark
)

// ── Saturn rings ──────────────────────────────────────────────────────────────

const RING_COLORS = ['#ffffff', '#cccccc', '#e8e8e8', '#bbbbbb', '#d4d4d4']

const rings = computed(() => {
  const orbits = props.data.ringOrbits ?? []
  if (!orbits.length) return []
  return orbits.map((orb, i) => ({
    rx: orb.orbitR,
    ry: orb.orbitR * 0.28,
    sw: orb.thickness ?? Math.max(2, props.data.size * 0.05),
    color: RING_COLORS[i % RING_COLORS.length],
    tilt: orb.tilt ?? 0,
  }))
})

// ── Gas giant bands ───────────────────────────────────────────────────────────

function adjustHex(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const h = n => Math.min(255, Math.max(0, amount > 0
    ? Math.round(n + (255 - n) * amount)
    : Math.round(n * (1 + amount))
  )).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

const gasGiant = computed(() => {
  if (!props.data.isGasGiant) return { angle: 0, bands: [] }
  const s = props.data.size
  const color = props.data.color
  const idx = props.data.memberIndex ?? 0
  const sm = props.data.sizeMultiplier ?? 1

  // Derive per-planet angle and thickness from index + size_multiplier
  const t1 = (idx * 13 + Math.round(sm * 7)) % 20   // 0–19
  const t2 = (idx * 7  + Math.round(sm * 11)) % 17  // 0–16
  const angle = -(10 + t1 * 1.3)                     // –10° to –35°
  const bandH = s * (0.03 + (t2 / 16) * 0.045)       // 3%–7.5% of diameter

  const amp    = bandH * 0.35
  const xStart = -s * 0.6
  const xEnd   = s * 1.6
  const w      = xEnd - xStart
  const numBands = Math.ceil((s + bandH * 2) / bandH)

  const bands = Array.from({ length: numBands }, (_, i) => {
    const y   = -bandH + i * bandH
    const dir = i % 2 === 0 ? 1 : -1
    const lf  = Math.sin(i * 1.1 + 0.5) * 0.07 + Math.sin(i * 0.4) * 0.03
    const d   = [
      `M ${xStart} ${y}`,
      `C ${xStart + w * 0.3} ${y - dir * amp} ${xStart + w * 0.7} ${y + dir * amp} ${xEnd} ${y}`,
      `L ${xEnd} ${y + bandH}`,
      `C ${xStart + w * 0.7} ${y + bandH + dir * amp} ${xStart + w * 0.3} ${y + bandH - dir * amp} ${xStart} ${y + bandH}`,
      'Z',
    ].join(' ')
    return { d, color: adjustHex(color, lf) }
  })

  return { angle, bands }
})

// ── Dwarf planet rocky/icy texture ────────────────────────────────────────────

// Blend a hex color toward a cold blue target by `amount` (0–1)
const COLD_BLUE = { r: 110, g: 160, b: 220 }
function blendToBlue(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const h = (n, target) => Math.round(n + (target - n) * amount).toString(16).padStart(2, '0')
  return `#${h(r, COLD_BLUE.r)}${h(g, COLD_BLUE.g)}${h(b, COLD_BLUE.b)}`
}

const dwarfPlanet = computed(() => {
  if (!props.data.isDwarfPlanet) return { patches: [], craters: [], baseColor: '#888', adjustedColor: '#888' }
  const s = props.data.size
  const idx   = props.data.memberIndex ?? 0
  const count = props.data.memberCount ?? 1
  const sm    = props.data.sizeMultiplier ?? 1
  const seed  = idx * 31 + Math.round(sm * 17)

  // Normalized orbital distance (0 = innermost, 1 = outermost)
  const t = count > 1 ? idx / (count - 1) : 0

  // Shift color toward cold blue based on distance from star
  const color = blendToBlue(props.data.color, t * 0.45)

  function sr(n) {
    return ((seed * 1664525 + n * 22695477 + 1013904223) % 10000) / 10000
  }

  const r  = s / 2
  const cx = s / 2
  const cy = s / 2

  // Slightly lightened base for icy appearance
  const baseColor = adjustHex(color, 0.10)

  // Irregular icy/rocky patches: 2-in-3 icy (lighter), 1-in-3 rocky (darker)
  const patches = Array.from({ length: 8 }, (_, i) => {
    const angle   = sr(i * 5)     * Math.PI * 2
    const dist    = sr(i * 5 + 1) * r * 0.75
    const x       = cx + dist * Math.cos(angle)
    const y       = cy + dist * Math.sin(angle)
    const rx      = r * (0.14 + sr(i * 5 + 2) * 0.28)
    const ry      = r * (0.08 + sr(i * 5 + 3) * 0.18)
    const rot     = sr(i * 5 + 4) * 180
    const lf      = i % 3 !== 2 ? (0.18 + sr(i) * 0.22) : -(0.12 + sr(i) * 0.18)
    const opacity = 0.55 + sr(i * 3 + 20) * 0.35
    return { x, y, rx, ry, rot, color: adjustHex(color, lf), opacity }
  })

  // Small craters: dark filled circles
  const craters = Array.from({ length: 5 }, (_, i) => {
    const angle = sr(i * 4 + 100) * Math.PI * 2
    const dist  = sr(i * 4 + 101) * r * 0.82
    const x     = cx + dist * Math.cos(angle)
    const y     = cy + dist * Math.sin(angle)
    const cr    = r * (0.03 + sr(i * 4 + 102) * 0.07)
    return { x, y, r: cr, color: adjustHex(color, -(0.32 + sr(i * 4 + 103) * 0.20)) }
  })

  return { patches, craters, baseColor, adjustedColor: color }
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
