<template>
  <nav
    class="border-b sticky top-0 z-50 transition-colors"
    :class="editPositions ? 'border-black/50' : 'bg-surface-900 border-surface-700'"
    :style="editPositions ? { backgroundImage: 'repeating-linear-gradient(45deg, #18181b 0px, #18181b 22px, #B8860B 22px, #B8860B 44px)' } : {}"
  >
    <div class="w-full px-4 sm:px-6 flex items-center justify-between h-14">
      <NuxtLink
        to="/"
        class="font-semibold text-lg tracking-wide transition-colors"
        :class="editPositions ? 'text-gray-100 hover:text-white' : 'text-accent-400 hover:text-accent-300'"
      >
        Cosmere Tracker
      </NuxtLink>
      <div class="flex items-center gap-4">
        <NuxtLink
          v-for="link in NAV_LINKS"
          :key="link.to"
          :to="link.to"
          class="text-sm font-medium transition-colors"
          :class="editPositions ? 'text-gray-100 hover:text-white' : 'text-indigo-300 hover:text-blue-100'"
          active-class="!text-accent-400"
        >
          {{ link.label }}
        </NuxtLink>
        <div ref="menuRef" class="relative">
          <button
            type="button"
            class="flex items-center transition-colors"
            :class="editPositions ? 'text-gray-100 hover:text-white' : 'text-indigo-300 hover:text-blue-100'"
            title="Menu"
            @click="menuOpen = !menuOpen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div
            v-if="menuOpen"
            class="absolute right-0 mt-2 w-40 rounded-lg border border-surface-700 bg-surface-800 shadow-lg py-1"
          >
            <NuxtLink
              to="/settings"
              class="flex items-center gap-2 px-3 py-2 text-sm text-indigo-300 hover:text-blue-100 hover:bg-surface-700 transition-colors"
              active-class="text-accent-400"
              @click="menuOpen = false"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </NuxtLink>
            <div v-if="route.path === '/'" class="flex items-center justify-between gap-2 px-3 py-2 text-sm text-indigo-300 border-t border-surface-700 mt-1 pt-2">
              <span>Edit Positions</span>
              <button
                type="button"
                class="relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none shrink-0"
                :class="editPositions ? 'bg-accent-600' : 'bg-surface-600'"
                @click="toggleEditPositions"
              >
                <span class="inline-block w-3 h-3 bg-white rounded-full shadow transition-transform" :class="editPositions ? 'translate-x-5' : 'translate-x-1'" />
              </button>
            </div>
            <div class="flex items-center justify-between gap-2 px-3 py-2 text-sm text-indigo-300 border-t border-surface-700 mt-1 pt-2">
              <span>New Sidebar UI</span>
              <button
                type="button"
                class="relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none shrink-0"
                :class="nuxtUiTimeline ? 'bg-accent-600' : 'bg-surface-600'"
                @click="setNuxtUiTimeline(!nuxtUiTimeline)"
              >
                <span class="inline-block w-3 h-3 bg-white rounded-full shadow transition-transform" :class="nuxtUiTimeline ? 'translate-x-5' : 'translate-x-1'" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
const { editPositions, startEdit, saveEdit } = useMapState()
const { nuxtUiTimeline, initNuxtUiTimeline, setNuxtUiTimeline } = useTimelinePrefs()
initNuxtUiTimeline()
const route = useRoute()

const NAV_LINKS = [
  { to: '/', label: 'Map' },
  { to: '/books', label: 'Books' },
  { to: '/characters', label: 'Characters' },
  { to: '/shards', label: 'Shards' },
  { to: '/magic-systems', label: 'Magic Systems' },
]

const menuOpen = ref(false)
const menuRef = ref(null)

// A toggle only has an on/off state, so there's no room for a separate
// Cancel (discard changes) action here — turning it off saves, same as the
// old sidebar button's Save action.
function toggleEditPositions() {
  if (editPositions.value) saveEdit()
  else startEdit()
}

function onClickOutside(e) {
  if (menuOpen.value && menuRef.value && !menuRef.value.contains(e.target)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>
