<template>
  <aside class="w-64 shrink-0 border-r border-surface-700 bg-surface-900 h-full flex flex-col">

    <!-- Tabs (map page only) -->
    <div v-if="route.path === '/'" class="flex gap-1 px-4 pt-3 pb-2 border-b border-surface-700 shrink-0">
      <button
        class="flex-1 py-1 text-xs font-medium rounded-md transition-colors"
        :class="activeTab === 'books' ? 'bg-accent-600 text-white' : 'text-indigo-400 hover:text-blue-100 hover:bg-surface-700'"
        @click="activeTab = 'books'"
      >Books</button>
      <button
        class="flex-1 py-1 text-xs font-medium rounded-md transition-colors"
        :class="activeTab === 'planets' ? 'bg-accent-600 text-white' : 'text-indigo-400 hover:text-blue-100 hover:bg-surface-700'"
        @click="activeTab = 'planets'"
      >Planets</button>
    </div>

    <!-- Books tab / default (non-map pages) -->
    <template v-if="activeTab === 'books' || route.path !== '/'">
      <div class="flex items-center justify-between px-4 pt-3 pb-1">
        <button class="text-xs text-indigo-400 hover:text-blue-200 transition-colors" @click="selectAllBooks">Select All</button>
        <button class="text-xs text-indigo-400 hover:text-blue-200 transition-colors" @click="unselectAllBooks">Unselect All</button>
      </div>
      <div class="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <div
          v-for="book in sortedBooks"
          :key="book.slug"
          class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-700 transition-colors group cursor-pointer"
          @click="toggleBook(book)"
        >
          <input
            type="checkbox"
            :checked="isBookVisible(book)"
            class="shrink-0 w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer pointer-events-none"
          />
          <NuxtLink
            :to="`/books/${book.slug}`"
            class="flex-1 text-sm truncate transition-colors"
            :class="isRead(book.slug) ? 'text-blue-100' : 'text-indigo-500 group-hover:text-indigo-300'"
            active-class="text-accent-400"
            @click.stop
          >
            {{ book.title }}
          </NuxtLink>
        </div>
      </div>
    </template>

    <!-- Planets tab (map page only) -->
    <template v-else-if="activeTab === 'planets'">
      <div class="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
        <button class="text-xs text-indigo-400 hover:text-blue-200 transition-colors"
          @click="systemsWithPlanets.forEach(s => s.planetList.forEach(p => { if (isPlanetHidden(p.slug)) togglePlanetVisibility(p.slug) }))">Select All</button>
        <button class="text-xs text-indigo-400 hover:text-blue-200 transition-colors"
          @click="systemsWithPlanets.forEach(s => s.planetList.forEach(p => { if (!isPlanetHidden(p.slug)) togglePlanetVisibility(p.slug) }))">Unselect All</button>
      </div>
      <div class="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        <div v-for="system in systemsWithPlanets" :key="system.slug">
          <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest px-2 mb-1">{{ system.name }}</p>
          <div class="space-y-0.5 ml-4">
            <div
              v-for="planet in system.planetList"
              :key="planet.slug"
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-700 transition-colors cursor-pointer"
              @click="togglePlanetVisibility(planet.slug)"
            >
              <input
                type="checkbox"
                :checked="!isPlanetHidden(planet.slug)"
                class="shrink-0 w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer pointer-events-none"
              />
              <div class="w-2 h-2 rounded-full shrink-0" :style="{ background: planet.color }" />
              <span class="flex-1 text-sm truncate transition-colors"
                :class="planet.uninhabited ? 'text-indigo-500 italic' : 'text-blue-100'">
                {{ planet.name }}
              </span>
            </div>
          </div>
        </div>
        <p v-if="!systemsWithPlanets.length" class="text-sm text-indigo-600 italic px-2">No planets loaded.</p>
      </div>
    </template>

    <!-- Edit positions — only on the map page -->
    <div v-if="route.path === '/'" class="shrink-0 border-t border-surface-700 px-4 py-3">
      <template v-if="!editPositions">
        <button
          class="w-full py-2 rounded-lg text-sm font-medium bg-surface-700 hover:bg-surface-600 text-indigo-300 hover:text-blue-100 transition-colors"
          @click="startEdit"
        >
          Edit Positions
        </button>
      </template>
      <template v-else>
        <div class="flex gap-2">
          <button
            class="flex-1 py-2 rounded-lg text-sm font-medium bg-accent-600 hover:bg-accent-500 text-white transition-colors"
            @click="saveEdit"
          >
            Save
          </button>
          <button
            class="flex-1 py-2 rounded-lg text-sm font-medium bg-surface-700 hover:bg-surface-600 text-indigo-300 hover:text-red-400 transition-colors"
            @click="cancelEdit"
          >
            Cancel
          </button>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
const { books, load } = useCosmere()
const { init, toggle, isRead } = useReadBooks()
const { editPositions, hiddenPlanetSlugs, initHiddenPlanets, togglePlanetVisibility, startEdit, saveEdit, cancelEdit } = useMapState()
const { planets, init: initPlanets } = usePlanetSettings()
const { systems, init: initSystems } = useSystemSettings()
const route = useRoute()

const activeTab = ref('planets')

await load()
init()
initHiddenPlanets()

if (route.path === '/') {
  await Promise.all([initPlanets(), initSystems()])
}

const sortedBooks = computed(() =>
  [...books.value].sort((a, b) => a.release_order - b.release_order)
)

const systemsWithPlanets = computed(() =>
  systems.value
    .map(system => {
      const planetList = (system.members ?? [])
        .filter(m => typeof m === 'object' && m.type === 'planet')
        .map(m => planets.value.find(p => p.slug === m.slug))
        .filter(Boolean)
      return { ...system, planetList }
    })
    .filter(s => s.planetList.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
)

function isPlanetHidden(slug) {
  return hiddenPlanetSlugs.value.includes(slug)
}

// Books tab checkbox = whether the user has explicitly marked this book as read
function isBookVisible(book) {
  return isRead(book.slug)
}

// Toggling a book marks it read/unread and shows/hides its planets.
// When unchecking, a planet is only hidden if no other checked book also has it.
function toggleBook(book) {
  const wasRead = isRead(book.slug)
  toggle(book.slug) // update readSlugs (now reflects new state)
  const slugs = book.planets ?? []
  if (!wasRead) {
    // Showing: unhide all planets for this book
    slugs.forEach(s => { if (isPlanetHidden(s)) togglePlanetVisibility(s) })
  } else {
    // Hiding: only hide planets not covered by another checked book
    slugs.forEach(planetSlug => {
      const coveredByOther = sortedBooks.value
        .some(b => b.slug !== book.slug && isRead(b.slug) && (b.planets ?? []).includes(planetSlug))
      if (!coveredByOther && !isPlanetHidden(planetSlug)) {
        togglePlanetVisibility(planetSlug)
      }
    })
  }
}

function selectAllBooks() {
  sortedBooks.value.forEach(book => {
    if (!isRead(book.slug)) toggle(book.slug)
    ;(book.planets ?? []).forEach(s => { if (isPlanetHidden(s)) togglePlanetVisibility(s) })
  })
}

function unselectAllBooks() {
  sortedBooks.value.forEach(book => {
    if (isRead(book.slug)) toggle(book.slug)
  })
  // Hide all book planets (after all books are unmarked)
  sortedBooks.value.forEach(book => {
    ;(book.planets ?? []).forEach(s => { if (!isPlanetHidden(s)) togglePlanetVisibility(s) })
  })
}
</script>
