<template>
  <div class="flex-1 overflow-y-auto px-3 py-3">
    <div v-if="activeShards.length" class="space-y-1">
      <div
        v-for="entity in activeShards"
        :key="entity.slug"
        class="group rounded px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        :class="locationFor(entity) ? 'cursor-pointer hover:bg-surface-800' : 'opacity-60'"
        :role="locationFor(entity) ? 'button' : undefined"
        :tabindex="locationFor(entity) ? 0 : undefined"
        @click="goToShard(entity)"
        @keydown.enter.prevent="goToShard(entity)"
        @keydown.space.prevent="goToShard(entity)"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <ShardIcon v-if="entity.type === 'shard' && entity.color" :color="entity.color" :size="20" class="shrink-0" />
            <span
              v-else
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :class="entity.color ? '' : 'bg-surface-600'"
              :style="entity.color ? { background: entity.color } : {}"
            />
            <span
              class="text-sm text-blue-100 truncate select-none transition-colors"
              :class="locationFor(entity) ? 'group-hover:text-accent-300' : ''"
            >{{ entity.name }}</span>
          </div>
          <span class="text-xs text-indigo-400 shrink-0 truncate select-none max-w-[40%]">
            {{ locationFor(entity)?.name ?? 'Unknown' }}
          </span>
        </div>
        <p v-if="entity.current_holder" class="text-xs text-indigo-500 mt-0.5">Held by {{ entity.current_holder }}</p>
      </div>
    </div>
    <p v-else class="text-sm text-indigo-600 italic px-2">No Shards exist yet.</p>
  </div>
</template>

<script setup>
import { resolveStatus, resolveLocation, INACTIVE_SHARD_STATUSES } from '~/utils/timelineFieldResolvers'

const { entities, init: initEntities } = useEntitySettings()
const { systems, init: initSystems } = useSystemSettings()
const { planets, init: initPlanets } = usePlanetSettings()
const { zoomTarget } = useMapState()
const route = useRoute()

await initEntities()
await initSystems()
await initPlanets()

const activeShards = computed(() =>
  entities.value
    .filter(e => e.type === 'shard' || e.type === 'splinter-remnant')
    .filter(e => !INACTIVE_SHARD_STATUSES.includes(resolveStatus(e.status_events ?? [], e.status)))
    .sort((a, b) => a.name.localeCompare(b.name))
)

function locationFor(entity) {
  const slug = resolveLocation(entity.location_events ?? [], entity.location_slug)
  if (!slug) return null
  const system = systems.value.find(s => s.slug === slug)
  if (system) return { type: 'system', slug, name: system.name }
  const planet = planets.value.find(p => p.slug === slug)
  if (planet) return { type: 'planet', slug, name: planet.name }
  return null
}

async function goToShard(entity) {
  const location = locationFor(entity)
  if (!location) return
  if (route.path !== '/') await navigateTo('/')
  zoomTarget.value = { type: location.type, slug: location.slug }
}
</script>
