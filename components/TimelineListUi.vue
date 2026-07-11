<template>
  <div class="flex-1 overflow-y-auto px-3 py-3">
    <UTimeline
      v-if="timelineItems.length"
      :items="timelineItems"
      :model-value="currentEvent?.slug"
      :reverse="timelineNewestFirst"
      size="xs"
      class="px-2"
    >
      <template #indicator="{ item }">
        <button
          type="button"
          class="w-full h-full rounded-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-400 flex items-center justify-center"
          :style="item.planetColor ? { background: item.planetColor } : {}"
          :aria-label="`Select ${item.title || 'event'}`"
          @click="setCurrentEvent(item.value)"
        >
          <UIcon v-if="item.bookIcon" :name="item.bookIcon" class="w-3 h-3" :style="item.planetColor ? { color: darkenHex(item.planetColor) } : {}" />
        </button>
      </template>
      <template #title="{ item }">
        <div class="flex items-center gap-2">
          <div
            class="cursor-pointer outline-none rounded focus-visible:ring-2 focus-visible:ring-accent-400"
            role="button"
            tabindex="0"
            @click="setCurrentEvent(item.value)"
            @keydown.enter.prevent="setCurrentEvent(item.value)"
            @keydown.space.prevent="setCurrentEvent(item.value)"
          >
            {{ item.title }}
          </div>
          <button
            v-if="item.hasZoomTarget && item.value === currentEvent?.slug"
            type="button"
            class="text-xs text-accent-400 hover:text-accent-300 transition-colors cursor-pointer shrink-0"
            @click="zoomToEvent(item.value)"
          >Go To</button>
        </div>
      </template>
      <template #description="{ item }">
        <div>
          <p v-if="item.description" class="text-xs text-indigo-500">{{ item.description }}</p>
          <div v-if="item.entitySlugs?.length" class="flex flex-wrap gap-1 mt-1">
            <span
              v-for="slug in item.entitySlugs"
              :key="slug"
              class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-indigo-300"
            >
              <ShardIcon v-if="entityFor(slug)?.type === 'shard' && entityFor(slug)?.color" :color="entityFor(slug).color" :size="12" class="shrink-0" />
              <span
                v-else-if="entityFor(slug)?.color"
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :style="{ background: entityFor(slug).color }"
              />
              {{ entityName(slug) }}
            </span>
          </div>
          <div v-if="item.subEvents?.length" class="mt-2 pl-3 border-l border-surface-700 space-y-2">
            <div v-for="(sub, i) in item.subEvents" :key="i">
              <p class="text-xs font-medium text-indigo-300">{{ sub.title }}</p>
              <p v-if="sub.description" class="text-xs text-indigo-500">{{ sub.description }}</p>
            </div>
          </div>
        </div>
      </template>
    </UTimeline>
    <p v-else class="text-sm text-indigo-600 italic px-2">No timeline events yet.</p>
  </div>
</template>

<script setup>
import { darkenHex } from '~/utils/colorUtils'

// Overrides the Nuxt UI Timeline indicator's default solid `bg-elevated`
// fill (and the active/completed color-variant fill on top of it) with a
// hollow ring, for events with no linked planet to draw a color from — `!`
// is needed since those state-variant fills are compiled later and would
// otherwise win over a plain unprefixed background utility.
const HOLLOW_INDICATOR_CLASSES = 'bg-transparent border border-surface-400 group-data-[state=active]:!bg-transparent group-data-[state=completed]:!bg-transparent group-data-[state=active]:!text-muted group-data-[state=completed]:!text-muted'

const { orderedEvents, init: initEvents, currentEvent, resolvedYearStart, resolvedYearEnd, initCurrentEvent, setCurrentEvent, zoomToEvent } = useTimelineEvents()
const { timelineNewestFirst } = useTimelinePrefs()
const { entities, init: initEntities } = useEntitySettings()
const { books, load: loadBooks } = useCosmere()
const { planets, init: initPlanets } = usePlanetSettings()

await initEvents()
initCurrentEvent()
initEntities()
loadBooks()
initPlanets()

function entityFor(slug) {
  return entities.value.find(e => e.slug === slug)
}

function bookIcon(slug) {
  return books.value.find(b => b.slug === slug)?.icon ?? null
}

function planetColor(slug) {
  return planets.value.find(p => p.slug === slug)?.color ?? null
}

function entityName(slug) {
  return entityFor(slug)?.name ?? slug
}

function dateLabel(ev) {
  const prefix = ev.estimated ? '~' : ''
  const start = resolvedYearStart(ev) ?? '—'
  if (ev.event_type === 'range') return `${prefix}${start}–${resolvedYearEnd(ev) ?? '—'}`
  return `${prefix}${start}`
}

const sortedEvents = computed(() =>
  timelineNewestFirst.value ? [...orderedEvents.value].reverse() : orderedEvents.value
)

// UTimeline only takes flat item props (no raw event object) — matching it
// back up to isReached/isCurrent isn't needed here since the component
// derives its own active/completed styling from `model-value` against
// `item.value`. Note `reverse` (bound above) doesn't reorder `items` itself
// — it only flips which side of the active index counts as "completed" —
// so it has to track `timelineNewestFirst` to stay correct once we've
// already reversed the array ourselves for display order.
const timelineItems = computed(() =>
  sortedEvents.value.map(ev => {
    const color = ev.planet_slug ? planetColor(ev.planet_slug) : null
    return {
      value: ev.slug,
      date: dateLabel(ev),
      title: ev.title,
      description: ev.description,
      entitySlugs: ev.entity_slugs ?? [],
      subEvents: ev.sub_events ?? [],
      bookIcon: ev.book_slug ? bookIcon(ev.book_slug) : null,
      planetColor: color,
      ui: color ? undefined : { indicator: HOLLOW_INDICATOR_CLASSES },
      hasZoomTarget: ev.zoom_scope === 'map' || !!ev.system_slug || !!ev.planet_slug,
    }
  })
)
</script>
