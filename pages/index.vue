<template>
  <div class="relative h-full">
    <VueFlow
      :nodes-connectable="false"
      :edges-updatable="false"
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
      <template #node-moon="nodeProps">
        <MoonNode v-bind="nodeProps" />
      </template>

      <div v-if="visibleNodes.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p class="text-indigo-700 text-sm">Check a book in the sidebar to reveal its world.</p>
      </div>
    </VueFlow>

    <!-- Right panel -->
    <Transition name="panel">
      <div
        v-if="selectedPlanet"
        class="absolute top-0 right-0 h-full w-1/5 bg-surface-900 border-l border-surface-700 z-10 flex flex-col"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <h2 class="text-base font-semibold text-blue-50 truncate">{{ selectedPlanet.name }}</h2>
          <button
            class="text-indigo-400 hover:text-blue-100 transition-colors p-1 -mr-1 shrink-0"
            @click="selectedPlanetSlug = null"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <!-- Color -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startColorEdit">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="startColorEdit">Color</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded-full shrink-0" :style="{ background: colorEditing ? colorDraft : selectedPlanet.color, boxShadow: `0 0 6px 2px ${colorEditing ? colorDraft : selectedPlanet.color}55` }" />
              <template v-if="colorEditing">
                <input ref="hexInputRef" v-model="colorDraft" type="text" maxlength="7" placeholder="#000000"
                  class="w-28 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveColor" @keydown.escape="colorEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors" @click="saveColor">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button class="text-red-400 hover:text-red-300 transition-colors" @click="colorEditing = false">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </template>
              <span v-else class="text-xs font-mono text-indigo-400">{{ selectedPlanet.color }}</span>
            </div>
          </div>

          <!-- Wiki -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startWikiEdit">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="startWikiEdit">Wiki</span>
            </div>
            <template v-if="wikiEditing">
              <div class="flex items-center gap-2">
                <input ref="wikiInputRef" v-model="wikiDraft" type="url" placeholder="https://coppermind.net/wiki/…"
                  class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveWiki" @keydown.escape="wikiEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveWiki">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="wikiEditing = false">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </template>
            <template v-else>
              <a v-if="selectedPlanet.wiki" :href="selectedPlanet.wiki" target="_blank" rel="noopener noreferrer"
                class="text-sm text-accent-400 hover:text-accent-300 transition-colors truncate block">
                {{ selectedPlanet.wiki }}
              </a>
              <span v-else class="text-sm text-indigo-600 italic">Not set</span>
            </template>
          </div>
          <!-- Moons -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="moonsEditing = !moonsEditing">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="moonsEditing = !moonsEditing">Moons</span>
            </div>
            <div class="space-y-1">
              <div v-for="moon in (selectedPlanet.moons ?? [])" :key="moon" class="flex items-center gap-2">
                <span class="flex-1 text-sm text-indigo-200">{{ moon }}</span>
                <button v-if="moonsEditing" class="text-red-400 hover:text-red-300 text-lg leading-none transition-colors"
                  @click="updateMoons(selectedPlanet.slug, (selectedPlanet.moons ?? []).filter(m => m !== moon))">×</button>
              </div>
              <p v-if="!(selectedPlanet.moons ?? []).length" class="text-sm text-indigo-600 italic">None</p>
            </div>
            <div v-if="moonsEditing" class="flex gap-2 mt-2">
              <input v-model="newMoonName" type="text" placeholder="Moon name…"
                class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                @keydown.enter="addPanelMoon" />
              <button class="px-3 py-1 bg-accent-600 hover:bg-accent-500 text-white text-xs rounded-lg transition-colors" @click="addPanelMoon">Add</button>
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
const { planets, init: initPlanets, nodeData, setColor, setWiki, updateMoons, batchUpdatePositions } = usePlanetSettings()
const { systems, init: initSystems, batchUpdateSystemPositions } = useSystemSettings()
const { editPositions, selectedPlanetSlug } = useMapState()

const selectedPlanet = computed(() =>
  planets.value.find(p => p.slug === selectedPlanetSlug.value) ?? null
)

const colorEditing = ref(false)
const colorDraft = ref('')
const hexInputRef = ref(null)

const wikiEditing = ref(false)
const wikiDraft = ref('')
const wikiInputRef = ref(null)

watch(selectedPlanetSlug, () => { colorEditing.value = false; wikiEditing.value = false })

function startColorEdit() {
  colorDraft.value = selectedPlanet.value?.color ?? ''
  colorEditing.value = true
  nextTick(() => hexInputRef.value?.focus())
}

function saveColor() {
  if (/^#[0-9a-f]{6}$/i.test(colorDraft.value)) {
    setColor(selectedPlanet.value.slug, colorDraft.value)
  }
  colorEditing.value = false
}

function startWikiEdit() {
  wikiDraft.value = selectedPlanet.value?.wiki ?? ''
  wikiEditing.value = true
  nextTick(() => wikiInputRef.value?.focus())
}

function saveWiki() {
  setWiki(selectedPlanet.value.slug, wikiDraft.value)
  wikiEditing.value = false
}

const moonsEditing = ref(false)
const newMoonName = ref('')
watch(selectedPlanetSlug, () => { moonsEditing.value = false; newMoonName.value = '' })

function addPanelMoon() {
  const name = newMoonName.value.trim()
  if (!name) return
  updateMoons(selectedPlanet.value.slug, [...(selectedPlanet.value.moons ?? []), name])
  newMoonName.value = ''
}

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
  return Math.floor(Math.max(0.1, p.size_multiplier ?? 1) * 64)
}

// Vue Flow requires parent nodes to appear before their children
const visibleNodes = computed(() => {
  const systemNodes = []
  const planetNodes = []

  for (const system of systems.value) {
    const planetSlugs = (system.members ?? system.planets ?? []).filter(m => typeof m === 'string' ? true : m.type === 'planet').map(m => typeof m === 'string' ? m : m.slug)
    const allMembers = planetSlugs.map(slug => planets.value.find(p => p.slug === slug)).filter(Boolean)
    const hasVisible = system.always_visible || allMembers.some(p => visibleWorldIds.value.has(p.slug))
    if (!hasVisible) continue

    const totalPlanetSize = allMembers.reduce((sum, p) => sum + planetSize(p), 0)
    const size = system.size ?? Math.max(150, totalPlanetSize * 8)
    const inhabitedMembers = allMembers.filter(p => !p.uninhabited)
    const color = averageHexColors((inhabitedMembers.length ? inhabitedMembers : allMembers).map(p => p.color))

    systemNodes.push({
      id: `system-${system.slug}`,
      type: 'system',
      position: { x: system.map_x, y: system.map_y },
      draggable: editPositions.value,
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
      // All planets in a visible system are shown (system visibility already checked above)
      const orbitR = innerR + (outerR - innerR) * (i + 1) / (n + 1)
      const pSize = planetSize(planet)
      planetNodes.push({
        id: planet.slug,
        type: 'planet',
        draggable: false,
        position: {
          x: sysCX + orbitR * Math.cos(angle) - pSize / 2,
          y: sysCY + orbitR * Math.sin(angle) - pSize / 2,
        },
        data: { ...nodeData(planet), systemSlug: system.slug },
      })

      // Moon nodes for this planet
      ;(planet.moons ?? []).forEach((_, mi) => {
        planetNodes.push({
          id: `moon-${planet.slug}-${mi}`,
          type: 'moon',
          draggable: false,
          position: { x: 0, y: 0 },  // driven by animation loop
          data: { parentSlug: planet.slug, index: mi, count: (planet.moons ?? []).length, planetSize: pSize },
        })
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
