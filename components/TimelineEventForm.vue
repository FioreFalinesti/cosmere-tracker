<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Required</p>
      <div class="flex flex-wrap items-center gap-3">
        <div class="inline-flex rounded-lg border border-surface-600 overflow-hidden">
          <button type="button"
            class="px-3 py-2 text-sm transition-colors"
            :class="draft.type === 'instance' ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-300 hover:text-blue-100'"
            @click="draft.type = 'instance'"
          >Instance</button>
          <button type="button"
            class="px-3 py-2 text-sm transition-colors"
            :class="draft.type === 'range' ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-300 hover:text-blue-100'"
            @click="draft.type = 'range'"
          >Range</button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <span class="text-xs text-indigo-500 w-10 shrink-0">{{ draft.type === 'range' ? 'Start' : 'Year' }}</span>
        <div class="inline-flex rounded-lg border border-surface-600 overflow-hidden">
          <button type="button"
            class="px-2 py-1.5 text-xs transition-colors"
            :class="draft.yearMode === 'absolute' ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-300 hover:text-blue-100'"
            @click="draft.yearMode = 'absolute'"
          >Absolute</button>
          <button type="button"
            class="px-2 py-1.5 text-xs transition-colors"
            :class="draft.yearMode === 'relative' ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-300 hover:text-blue-100'"
            @click="draft.yearMode = 'relative'"
          >Relative</button>
        </div>
        <input v-if="draft.yearMode === 'absolute'" v-model="draft.yearStart" type="number" placeholder="Year"
          class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-28" />
        <template v-else>
          <select v-model="draft.anchorSlug"
            class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 focus:outline-none focus:border-accent-500 transition-colors">
            <option value="">Anchor event…</option>
            <option v-for="ev in anchorOptions" :key="ev.slug" :value="ev.slug">{{ anchorLabel(ev) }}</option>
          </select>
          <input v-model="draft.anchorOffset" type="number" placeholder="+ years after"
            class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-32" />
        </template>
      </div>

      <div v-if="draft.type === 'range'" class="flex flex-wrap items-center gap-3">
        <span class="text-xs text-indigo-500 w-10 shrink-0">End</span>
        <div class="inline-flex rounded-lg border border-surface-600 overflow-hidden">
          <button type="button"
            class="px-2 py-1.5 text-xs transition-colors"
            :class="draft.endMode === 'absolute' ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-300 hover:text-blue-100'"
            @click="draft.endMode = 'absolute'"
          >Absolute</button>
          <button type="button"
            class="px-2 py-1.5 text-xs transition-colors"
            :class="draft.endMode === 'duration' ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-300 hover:text-blue-100'"
            @click="draft.endMode = 'duration'"
          >Duration</button>
        </div>
        <input v-if="draft.endMode === 'absolute'" v-model="draft.yearEnd" type="number" placeholder="Year end"
          class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-28" />
        <input v-else v-model="draft.duration" type="number" placeholder="Duration (years)"
          class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-36" />
      </div>
    </div>

    <div class="space-y-2">
      <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Optional</p>
      <div class="flex flex-wrap items-center gap-3">
        <input v-model="draft.title" type="text" placeholder="Event title (optional)"
          class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-48" />
        <select v-model="draft.bookSlug"
          class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 focus:outline-none focus:border-accent-500 transition-colors">
          <option value="">No linked book</option>
          <option v-for="b in sortedBooks" :key="b.slug" :value="b.slug">{{ b.title }}</option>
        </select>
        <div class="flex gap-3">
          <select v-model="draft.systemSlug" @change="onSystemChange"
            class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 focus:outline-none focus:border-accent-500 transition-colors">
            <option value="">No linked system</option>
            <option v-for="s in sortedSystems" :key="s.slug" :value="s.slug">{{ s.name }}</option>
          </select>
          <select v-model="draft.planetSlug" @change="onPlanetChange"
            class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 focus:outline-none focus:border-accent-500 transition-colors">
            <option value="">No linked planet</option>
            <option v-for="p in planetOptions" :key="p.slug" :value="p.slug">{{ p.name }}</option>
          </select>
        </div>
        <div v-if="draft.planetSlug" class="inline-flex rounded-lg border border-surface-600 overflow-hidden">
          <button type="button"
            class="px-2 py-1.5 text-xs transition-colors"
            :class="draft.zoomScope === 'planet' ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-300 hover:text-blue-100'"
            @click="draft.zoomScope = 'planet'"
          >Focus: Planet</button>
          <button type="button"
            class="px-2 py-1.5 text-xs transition-colors"
            :class="draft.zoomScope === 'system' ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-300 hover:text-blue-100'"
            @click="draft.zoomScope = 'system'"
          >Focus: System</button>
        </div>
      </div>
      <textarea v-model="draft.description" placeholder="Description (optional)" rows="2"
        class="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors" />

      <div v-if="sortedEntities.length" class="space-y-1.5">
        <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Related Entities</p>
        <div class="flex flex-wrap gap-x-4 gap-y-1.5">
          <label v-for="e in sortedEntities" :key="e.slug" class="flex items-center gap-2 text-sm text-blue-100 cursor-pointer">
            <input type="checkbox" :value="e.slug" v-model="draft.entitySlugs" class="accent-accent-600" />
            <span>{{ e.name }}</span>
          </label>
        </div>
      </div>

      <div v-if="draft.planetSlug" class="space-y-1.5">
        <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Orbit Events to Trigger</p>
        <label v-for="ev in selectedPlanetOrbitEvents" :key="ev.id" class="flex items-center gap-2 text-sm text-blue-100 cursor-pointer">
          <input type="checkbox" :value="ev.id" v-model="draft.orbitEventIds" class="accent-accent-600" />
          <span v-if="ev.color_after != null" class="w-3 h-3 rounded-full shrink-0 inline-block" :style="{ background: ev.color_after }" />
          <span>{{ orbitEventLabel(ev) }}</span>
        </label>
        <p v-if="!selectedPlanetOrbitEvents.length" class="text-sm text-indigo-600 italic">This planet has no orbit events yet — add some from its info panel on the map.</p>
      </div>

      <div v-if="draft.systemSlug" class="space-y-1.5">
        <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">System Existence Events to Trigger</p>
        <label v-for="ev in selectedSystemExistenceEvents" :key="ev.id" class="flex items-center gap-2 text-sm text-blue-100 cursor-pointer">
          <input type="checkbox" :value="ev.id" v-model="draft.orbitEventIds" class="accent-accent-600" />
          <span>{{ orbitEventLabel(ev) }}</span>
        </label>
        <p v-if="!selectedSystemExistenceEvents.length" class="text-sm text-indigo-600 italic">This system has no existence events yet.</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button
        class="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        :disabled="!canSubmit || status === 'running'"
        @click="$emit('submit')"
      >{{ submitLabel }}</button>
      <button v-if="showCancel" type="button"
        class="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-indigo-300 text-sm rounded-lg transition-colors"
        @click="$emit('cancel')"
      >Cancel</button>
      <span v-if="status === 'error'" class="text-sm text-red-400">{{ error }}</span>
      <span v-else-if="status === 'done'" class="text-sm text-green-400">Saved</span>
      <span v-else-if="!canSubmit" class="text-xs text-indigo-500">Fill in the required fields to continue.</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  draft: { type: Object, required: true },
  books: { type: Array, required: true },
  systems: { type: Array, required: true },
  planets: { type: Array, required: true },
  excludeSlug: { type: String, default: '' },
  submitLabel: { type: String, default: 'Add Event' },
  showCancel: { type: Boolean, default: false },
  status: { type: String, default: 'idle' },
  error: { type: String, default: '' },
})
defineEmits(['submit', 'cancel'])

const { orderedEvents, eventYear } = useTimelineEvents()
const { entities, init: initEntities } = useEntitySettings()
initEntities()

const sortedBooks = computed(() => [...props.books].sort((a, b) => a.release_order - b.release_order))
const sortedSystems = computed(() => [...props.systems].sort((a, b) => a.name.localeCompare(b.name)))
const sortedPlanets = computed(() => [...props.planets].sort((a, b) => a.name.localeCompare(b.name)))
const sortedEntities = computed(() => [...entities.value].sort((a, b) => a.name.localeCompare(b.name)))

const anchorOptions = computed(() => orderedEvents.value.filter(e => e.slug !== props.excludeSlug))
function anchorLabel(ev) {
  const year = eventYear(ev)
  return `${ev.title || 'Untitled'}${year != null ? ` (${year})` : ''}`
}

function systemPlanetSlugs(system) {
  return (system?.members ?? system?.planets ?? [])
    .filter(m => typeof m === 'string' || m.type === 'planet')
    .map(m => typeof m === 'string' ? m : m.slug)
}

function systemForPlanet(planetSlug) {
  return props.systems.find(s => systemPlanetSlugs(s).includes(planetSlug))
}

const planetOptions = computed(() => {
  if (!props.draft.systemSlug) return sortedPlanets.value
  const slugs = new Set(systemPlanetSlugs(props.systems.find(s => s.slug === props.draft.systemSlug)))
  return sortedPlanets.value.filter(p => slugs.has(p.slug))
})

const selectedPlanetOrbitEvents = computed(() =>
  props.planets.find(p => p.slug === props.draft.planetSlug)?.orbit_events ?? []
)

const selectedSystemExistenceEvents = computed(() =>
  props.systems.find(s => s.slug === props.draft.systemSlug)?.existence_events ?? []
)

function orbitEventLabel(ev) {
  const parts = []
  if (ev.orbit_after != null) parts.push(`${ev.orbit_before ?? 'auto'}px → ${ev.orbit_after}px`)
  if (ev.color_after != null) parts.push(`${ev.color_before} → ${ev.color_after}`)
  if ('exists_after' in ev) parts.push(ev.exists_after ? 'starts existing' : 'stops existing')
  return parts.join(' · ')
}

function onSystemChange() {
  const slugs = new Set(systemPlanetSlugs(props.systems.find(s => s.slug === props.draft.systemSlug)))
  if (props.draft.planetSlug && !slugs.has(props.draft.planetSlug)) {
    props.draft.planetSlug = ''
    props.draft.orbitEventIds = []
  }
}

function onPlanetChange() {
  props.draft.orbitEventIds = []
  if (!props.draft.planetSlug) return
  props.draft.systemSlug = systemForPlanet(props.draft.planetSlug)?.slug ?? props.draft.systemSlug
}

const canSubmit = computed(() => {
  const yearOk = props.draft.yearMode === 'relative'
    ? props.draft.anchorSlug !== '' && props.draft.anchorOffset !== ''
    : props.draft.yearStart !== ''
  if (!yearOk) return false
  if (props.draft.type !== 'range') return true
  return props.draft.endMode === 'duration' ? props.draft.duration !== '' : props.draft.yearEnd !== ''
})
</script>
