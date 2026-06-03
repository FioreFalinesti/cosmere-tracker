<template>
  <div class="relative h-full">
    <VueFlow
      :nodes-connectable="false"
      :edges-updatable="false"
      :nodes-draggable="editPositions"
      :min-zoom="0.25"
      :max-zoom="4"
      class="cosmere-map"
      @node-click="onNodeClick"
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
            @click="selectedSlug = null"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-5 py-4">
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
const { planets, init: initPlanets, nodeData, setColor, batchUpdatePositions } = usePlanetSettings()
const { systems, init: initSystems } = useSystemSettings()
const { editPositions } = useMapState()

await load()
await initRead()
await initPlanets()
await initSystems()

const allEdges = [
  { id: 'e-roshar-braize', source: 'roshar', target: 'braize', animated: true, style: { stroke: '#f87171', strokeWidth: 1.5, strokeDasharray: '4 4' } },
  { id: 'e-roshar-ashyn',  source: 'roshar', target: 'ashyn',  animated: true, style: { stroke: '#a78bfa', strokeWidth: 1.5, strokeDasharray: '4 4' } },
]

const visibleWorldIds = computed(() => {
  const ids = new Set()
  for (const book of books.value) {
    if (readSlugs.value.includes(book.slug) && book.planets) {
      book.planets.forEach(p => ids.add(p))
    }
  }
  return ids
})

function planetSize(p) {
  return Math.floor((p.size_multiplier ?? 1) * 16)
}

// Vue Flow requires parent nodes to appear before their children
const visibleNodes = computed(() => {
  const systemNodes = []
  const planetNodes = []

  for (const system of systems.value) {
    const allMembers = planets.value.filter(p => p.system_slug?.trim() === system.slug)
    const hasVisible = allMembers.some(p => visibleWorldIds.value.has(p.slug))
    if (!hasVisible) continue

    const size = system.size ?? 200
    const color = averageHexColors(allMembers.map(p => p.color))

    systemNodes.push({
      id: `system-${system.slug}`,
      type: 'system',
      position: { x: system.map_x, y: system.map_y },
      style: { width: `${size}px`, height: `${size}px`, zIndex: -1 },
      data: { name: system.name, starName: system.star_name ?? null, color, size, slug: system.slug },
    })

    allMembers.forEach((planet) => {
      if (!visibleWorldIds.value.has(planet.slug)) return
      planetNodes.push({
        id: planet.slug,
        type: 'planet',
        position: { x: planet.map_x, y: planet.map_y },
        data: nodeData(planet),
      })
    })
  }

  return [...systemNodes, ...planetNodes]
})

const visibleEdges = computed(() =>
  allEdges.filter(e =>
    visibleWorldIds.value.has(e.source) && visibleWorldIds.value.has(e.target)
  )
)


const selectedSlug = ref(null)
const selectedPlanet = computed(() =>
  planets.value.find(p => p.slug === selectedSlug.value) ?? null
)

function onNodeClick({ node }) {
  if (node.type === 'planet') selectedSlug.value = node.id
}

</script>

<style>
.cosmere-map .vue-flow__edge-path { stroke-opacity: 0.6; }
.cosmere-map .vue-flow__handle { display: none; }
.cosmere-map .vue-flow__node { background: transparent; border: none; padding: 0; }
.cosmere-map .vue-flow__node.selected > div { outline: none; }
.cosmere-map .vue-flow__node { cursor: pointer; }
</style>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
