<template>
  <div class="relative h-full">
    <VueFlow
      :nodes-connectable="false"
      :edges-updatable="false"
      :nodes-draggable="editPositions"
      :min-zoom="0.25"
      :max-zoom="4"
      class="cosmere-map"
    >
      <MapSync :nodes="visibleNodes" :edges="visibleEdges" :edit-positions="editPositions" />
      <Background
        variant="dots"
        :gap="40"
        :size="1.2"
        pattern-color="#1e3a6e"
        bg-color="#000000"
      />
      <template #node-planet="nodeProps">
        <PlanetNode v-bind="nodeProps" />
      </template>
      <template #node-system="nodeProps">
        <SystemNode v-bind="nodeProps" />
      </template>

      <div v-if="visibleNodes.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p class="text-indigo-700 text-sm">Check a book in the sidebar to reveal its world.</p>
      </div>
    </VueFlow>

    <!-- Right panel -->
    <Transition name="panel">
      <div
        v-if="selectedPlanet"
        class="absolute top-0 right-0 h-full w-2/5 bg-surface-900 border-l border-surface-700 z-10 flex flex-col"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <div class="flex items-center gap-3">
            <label class="relative cursor-pointer group">
              <div
                class="w-4 h-4 rounded-full shrink-0 ring-2 ring-transparent group-hover:ring-white/30 transition-all"
                :style="{ background: selectedPlanet.color, boxShadow: `0 0 6px 2px ${selectedPlanet.color}55` }"
              />
              <input
                type="color"
                :value="selectedPlanet.color"
                class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                @input="e => setColor(selectedPlanet.slug, e.target.value)"
              />
            </label>
            <h2 class="text-base font-semibold text-blue-50">{{ selectedPlanet.name }}</h2>
          </div>
          <button
            class="text-indigo-400 hover:text-blue-100 transition-colors p-1 -mr-1"
            @click="selectedPlanetSlug = null"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <!-- Wiki link -->
          <div>
            <label class="block text-xs text-indigo-400 uppercase tracking-widest mb-1.5">Wiki</label>
            <div class="flex items-center gap-2">
              <input
                :value="selectedPlanet.wiki ?? ''"
                type="url"
                placeholder="https://coppermind.net/wiki/…"
                class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                @change="e => setWiki(selectedPlanet.slug, e.target.value)"
              />
              <a
                v-if="selectedPlanet.wiki"
                :href="selectedPlanet.wiki"
                target="_blank"
                rel="noopener noreferrer"
                class="shrink-0 px-3 py-2 bg-surface-700 hover:bg-surface-600 border border-surface-600 rounded-lg text-xs text-indigo-300 hover:text-blue-100 transition-colors"
              >
                Visit ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { averageHexColors } from '~/utils/colorUtils'

definePageMeta({ layout: 'map' })

const { books, load } = useCosmere()
const { readSlugs, init: initRead } = useReadBooks()
const { planets, init: initPlanets, nodeData, setColor, setWiki, batchUpdatePositions } = usePlanetSettings()
const { systems, init: initSystems, batchUpdateSystemPositions } = useSystemSettings()
const { editPositions, selectedPlanetSlug } = useMapState()

const selectedPlanet = computed(() =>
  planets.value.find(p => p.slug === selectedPlanetSlug.value) ?? null
)

await load()
await initRead()
await initPlanets()
await initSystems()

const visibleWorldIds = computed(() => {
  const ids = new Set()
  for (const book of books.value) {
    if (readSlugs.value.includes(book.slug) && book.planets) {
      book.planets.forEach(p => ids.add(p))
    }
  }
  return ids
})

const visibleEdges = ref([])

function planetSize(p) {
  return Math.floor(Math.max(0.1, p.size_multiplier ?? 1) * 16)
}

// Vue Flow requires parent nodes to appear before their children
const visibleNodes = computed(() => {
  const systemNodes = []
  const planetNodes = []

  for (const system of systems.value) {
    const allMembers = (system.planets ?? []).map(slug => planets.value.find(p => p.slug === slug)).filter(Boolean)
    const hasVisible = system.always_visible || allMembers.some(p => visibleWorldIds.value.has(p.slug))
    if (!hasVisible) continue

    const size = system.size ?? 200
    const color = averageHexColors(allMembers.map(p => p.color))

    systemNodes.push({
      id: `system-${system.slug}`,
      type: 'system',
      position: { x: system.map_x, y: system.map_y },
      style: { width: `${size}px`, height: `${size}px`, zIndex: -1 },
      data: { name: system.name, starName: system.star_name ?? null, color, size, slug: system.slug, planetCount: allMembers.length },
    })

    // Orbit geometry — matches the formula in SystemNode.vue
    const sunS = Math.max(6, Math.round(size * 0.08))
    const innerR = sunS / 2 + 4
    const outerR = size / 2 - 6
    const n = allMembers.length
    const sysCX = system.map_x + size / 2
    const sysCY = system.map_y + size / 2
    const angle = -Math.PI / 2  // 12 o'clock

    allMembers.forEach((planet, i) => {
      if (!system.always_visible && !visibleWorldIds.value.has(planet.slug)) return
      const orbitR = innerR + (outerR - innerR) * (i + 1) / (n + 1)
      const pSize = planetSize(planet)
      planetNodes.push({
        id: planet.slug,
        type: 'planet',
        position: {
          x: sysCX + orbitR * Math.cos(angle) - pSize / 2,
          y: sysCY + orbitR * Math.sin(angle) - pSize / 2,
        },
        data: { ...nodeData(planet), systemSlug: system.slug },
      })
    })
  }

  return [...systemNodes, ...planetNodes]
})
</script>

<style>
.cosmere-map .vue-flow__edge-path { stroke-opacity: 0.6; }
.cosmere-map .vue-flow__handle { display: none; }
.cosmere-map .vue-flow__node { background: transparent; border: none; padding: 0; }
.cosmere-map .vue-flow__node.selected > div { outline: none; }
.cosmere-map .vue-flow__node { cursor: pointer; }
</style>

<style scoped>
.panel-enter-active, .panel-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.panel-enter-from, .panel-leave-to { transform: translateX(100%); opacity: 0; }
</style>
