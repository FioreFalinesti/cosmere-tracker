<template>
  <div class="relative h-full">
    <VueFlow
      :nodes="visibleNodes"
      :edges="visibleEdges"
      :nodes-connectable="false"
      :edges-updatable="false"
      :min-zoom="0.25"
      :max-zoom="4"
      class="cosmere-map"
      @node-click="onNodeClick"
    >
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
            <div
              class="w-3 h-3 rounded-full shrink-0"
              :style="{ background: selectedPlanet.color, boxShadow: `0 0 6px 2px ${selectedPlanet.color}55` }"
            />
            <h2 class="text-base font-semibold text-blue-50">{{ selectedPlanet.name }}</h2>
          </div>
          <button
            class="text-indigo-400 hover:text-blue-100 transition-colors p-1 -mr-1"
            @click="selectedPlanet = null"
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
import { planets } from '~/composables/usePlanetSettings'

definePageMeta({ layout: 'map' })

const { books, load } = useCosmere()
const { readIds, init: initRead } = useReadBooks()
const { init: initPlanets, nodeData, overrides } = usePlanetSettings()

await load()
await initRead()
await initPlanets()

const worldBooks = {
  sel:      ['elantris', 'the-emperors-soul'],
  scadrial: ['the-final-empire', 'the-well-of-ascension', 'the-hero-of-ages',
             'the-alloy-of-law', 'shadows-of-self', 'the-bands-of-mourning',
             'the-lost-metal', 'mistborn-secret-history'],
  nalthis:  ['warbreaker'],
  roshar:   ['the-way-of-kings', 'words-of-radiance', 'edgedancer', 'oathbringer',
             'rhythm-of-war', 'dawnshard', 'wind-and-truth'],
  braize:   ['the-way-of-kings', 'words-of-radiance', 'oathbringer', 'rhythm-of-war', 'wind-and-truth'],
  ashyn:    ['the-way-of-kings', 'words-of-radiance', 'oathbringer', 'rhythm-of-war'],
  taldain:  ['arcanum-unbounded'],
  threnody: ['arcanum-unbounded'],
  lumar:    ['tress-of-the-emerald-sea'],
  komashi:  ['yumi-and-the-nightmare-painter'],
  canticle: ['the-sunlit-man'],
}

const allEdges = [
  { id: 'e-roshar-braize', source: 'roshar', target: 'braize', animated: true, style: { stroke: '#f87171', strokeWidth: 1.5, strokeDasharray: '4 4' } },
  { id: 'e-roshar-ashyn',  source: 'roshar', target: 'ashyn',  animated: true, style: { stroke: '#a78bfa', strokeWidth: 1.5, strokeDasharray: '4 4' } },
]

const visibleWorldIds = computed(() => new Set(
  Object.entries(worldBooks)
    .filter(([, bookIds]) => bookIds.some(id => readIds.value.has(id)))
    .map(([worldId]) => worldId)
))

const visibleNodes = computed(() =>
  planets
    .filter(p => visibleWorldIds.value.has(p.id))
    .map(p => ({
      id: p.id,
      type: 'planet',
      position: p.position,
      data: nodeData(p),
    }))
)

const visibleEdges = computed(() =>
  allEdges.filter(e =>
    visibleWorldIds.value.has(e.source) && visibleWorldIds.value.has(e.target)
  )
)

const selectedPlanet = ref(null)

function onNodeClick({ node }) {
  selectedPlanet.value = node.data
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
