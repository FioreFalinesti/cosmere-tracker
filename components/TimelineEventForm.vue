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
        <input v-model="draft.yearStart" type="number" :placeholder="draft.type === 'range' ? 'Year start' : 'Year'"
          class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-28" />
        <input v-if="draft.type === 'range'" v-model="draft.yearEnd" type="number" placeholder="Year end"
          class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-28" />
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
      </div>
      <textarea v-model="draft.description" placeholder="Description (optional)" rows="2"
        class="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors" />

      <div v-if="draft.planetSlug" class="space-y-1.5">
        <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Orbit Events to Trigger</p>
        <label v-for="ev in selectedPlanetOrbitEvents" :key="ev.id" class="flex items-center gap-2 text-sm text-blue-100 cursor-pointer">
          <input type="checkbox" :value="ev.id" v-model="draft.orbitEventIds" class="accent-accent-600" />
          <span v-if="ev.color_after != null" class="w-3 h-3 rounded-full shrink-0 inline-block" :style="{ background: ev.color_after }" />
          <span>{{ orbitEventLabel(ev) }}</span>
        </label>
        <p v-if="!selectedPlanetOrbitEvents.length" class="text-sm text-indigo-600 italic">This planet has no orbit events yet — add some from its info panel on the map.</p>
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
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  draft: { type: Object, required: true },
  books: { type: Array, required: true },
  systems: { type: Array, required: true },
  planets: { type: Array, required: true },
  submitLabel: { type: String, default: 'Add Event' },
  showCancel: { type: Boolean, default: false },
  status: { type: String, default: 'idle' },
  error: { type: String, default: '' },
})
defineEmits(['submit', 'cancel'])

const sortedBooks = computed(() => [...props.books].sort((a, b) => a.release_order - b.release_order))
const sortedSystems = computed(() => [...props.systems].sort((a, b) => a.name.localeCompare(b.name)))
const sortedPlanets = computed(() => [...props.planets].sort((a, b) => a.name.localeCompare(b.name)))

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

function orbitEventLabel(ev) {
  const parts = []
  if (ev.orbit_after != null) parts.push(`${ev.orbit_before ?? 'auto'}px → ${ev.orbit_after}px`)
  if (ev.color_after != null) parts.push(`${ev.color_before} → ${ev.color_after}`)
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
  if (props.draft.yearStart === '') return false
  if (props.draft.type === 'range') return props.draft.yearEnd !== ''
  return true
})
</script>
