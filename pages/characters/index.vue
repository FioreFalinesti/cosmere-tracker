<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-blue-50 mb-1">Characters</h1>
      <p class="text-indigo-400 text-sm">{{ revealedCharacters.length }} characters revealed so far</p>
    </div>

    <div class="relative mb-4">
      <input
        v-model="query"
        type="text"
        placeholder="Search by name or description…"
        class="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 pl-10 text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
      />
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>

    <div class="flex items-center gap-4 mb-6">
      <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Filters</p>
      <label class="flex items-center gap-2 text-sm text-indigo-300 cursor-pointer">
        <input type="checkbox" v-model="filters.shardholdersOnly" class="accent-accent-600" />
        Shardholders
      </label>
      <label class="flex items-center gap-2 text-sm text-indigo-300 cursor-pointer">
        <input type="checkbox" v-model="filters.hideDeceased" class="accent-accent-600" />
        Hide deceased
      </label>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <NuxtLink
        v-for="character in displayedCharacters"
        :key="character.id"
        :to="`/characters/${character.id}`"
        class="group flex flex-col bg-surface-800 border border-surface-700 rounded-xl p-4 hover:border-accent-500/50 hover:bg-surface-700 transition-all"
        :class="{ 'opacity-50': isCharacterDead(character) }"
      >
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <ShardIcon
            v-if="currentShardFor(character)"
            :color="currentShardFor(character).color"
            :size="35"
            class="shrink-0"
          />
          <span
            class="font-semibold transition-colors"
            :class="character.name === 'unknown' ? 'text-indigo-500 italic font-normal group-hover:text-indigo-400' : 'text-blue-50 group-hover:text-accent-400'"
          >
            {{ character.name }}
          </span>
          <span v-if="character.isPoV" class="text-xs text-gold-400 font-medium">PoV</span>
          <span v-if="isCharacterDead(character)" class="text-xs text-red-400 font-medium">Deceased</span>
        </div>
        <p class="text-xs text-indigo-400 mb-2">{{ character.world }}</p>
        <p class="text-sm text-blue-200 line-clamp-2 mb-3">{{ character.description }}</p>
        <div class="flex flex-wrap gap-1.5 mt-auto">
          <NuxtLink
            v-for="entry in booksFor(character.id)"
            :key="entry.book.slug"
            :to="`/books/${entry.book.slug}`"
            class="text-xs bg-surface-700 hover:bg-surface-600 text-indigo-300 hover:text-blue-100 px-2 py-0.5 rounded transition-colors"
            @click.stop
          >
            {{ entry.book.title }}
          </NuxtLink>
        </div>
      </NuxtLink>
    </div>

    <p v-if="displayedCharacters.length === 0" class="text-indigo-400 text-center py-12">
      {{ query.trim() ? `No characters match "${query}"` : 'No characters match the current filters.' }}
    </p>
  </div>
</template>

<script setup>
import Fuse from 'fuse.js'
import { resolveStatus, INACTIVE_SHARD_STATUSES } from '~/utils/timelineFieldResolvers'

const { characters, books, appearances, load } = useCosmere()
const { events: timelineEvents, init: initEvents, isReached, isBookReached } = useTimelineEvents()
const { entities, init: initEntities } = useEntitySettings()
await load()
await initEvents()
await initEntities()

// A character is revealed once the timeline has reached any book they
// appear in — avoids spoiling that a character exists before we've gotten
// to them, and someone appearing in multiple books stays revealed once any
// one of those has been reached. A character with no book appearance yet
// (e.g. a Shard's original Vessel, predating any book) can instead carry a
// direct reveal_event_slug pointing at the timeline event that introduces
// them.
function isCharacterRevealed(c) {
  const viaBook = appearances.value.some(a => a.characterId === c.id && isBookReached(a.bookId))
  const viaEvent = c.reveal_event_slug
    ? timelineEvents.value.some(ev => ev.slug === c.reveal_event_slug && isReached(ev))
    : false
  return viaBook || viaEvent
}

const revealedCharacters = computed(() => characters.value.filter(isCharacterRevealed))

// A character dies either explicitly — a `death_event_slug` pointing at the
// timeline event where it happens, mirroring `reveal_event_slug` above — or,
// for a Shard's original Vessel, implicitly: splintering a Shard kills its
// Vessel unless a book states otherwise, so this is derived from the Shard's
// own status_events rather than duplicated per-character.
function isCharacterDead(c) {
  const explicit = c.death_event_slug
    ? timelineEvents.value.some(ev => ev.slug === c.death_event_slug && isReached(ev))
    : false
  if (explicit) return true
  if (!c.vessel_of_slug) return false
  const shard = entities.value.find(e => e.slug === c.vessel_of_slug)
  if (!shard) return false
  return resolveStatus(shard.status_events ?? [], shard.status) === 'splintered'
}

// The Shard a character currently holds, if any: still linked to a Shard
// whose resolved status (as of the current timeline event) is an active,
// distinct Shard — not yet formed (e.g. Harmony, pre-Catacendre) or past a
// terminal state (splintering means its vessel no longer holds it) both
// drop them out of this, same as any other time-aware status in this app.
function currentShardFor(c) {
  if (!c.vessel_of_slug) return null
  const shard = entities.value.find(e => e.slug === c.vessel_of_slug)
  if (!shard) return null
  const status = resolveStatus(shard.status_events ?? [], shard.status)
  return INACTIVE_SHARD_STATUSES.includes(status) ? null : shard
}

function isCurrentVessel(c) {
  return !!currentShardFor(c)
}

const filters = reactive({ shardholdersOnly: false, hideDeceased: false })

const filteredCharacters = computed(() => {
  let list = revealedCharacters.value
  if (filters.shardholdersOnly) list = list.filter(isCurrentVessel)
  if (filters.hideDeceased) list = list.filter(c => !isCharacterDead(c))
  return list
})

const query = ref('')

const fuse = computed(() =>
  new Fuse(filteredCharacters.value, {
    keys: ['name', 'description'],
    threshold: 0.35,
  })
)

const displayedCharacters = computed(() => {
  if (!query.value.trim()) return filteredCharacters.value
  return fuse.value.search(query.value).map(r => r.item)
})

// Only list appearances in books the timeline has actually reached — a
// character with a later book still to come shouldn't have it spoiled here.
function booksFor(characterId) {
  return appearances.value
    .filter(a => a.characterId === characterId && isBookReached(a.bookId))
    .map(a => ({ book: books.value.find(b => b.slug === a.bookId) }))
    .filter(x => x.book)
}
</script>
