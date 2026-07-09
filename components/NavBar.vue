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
        <UDropdownMenu :items="menuGroups" :content="{ align: 'end' }" :ui="{ content: 'w-56' }">
          <button
            type="button"
            class="flex items-center transition-colors cursor-pointer"
            :class="editPositions ? 'text-gray-100 hover:text-white' : 'text-indigo-300 hover:text-blue-100'"
            title="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <template #account>
            <div class="flex items-center gap-2 w-full">
              <template v-if="currentUser">
                <img v-if="currentUser.photoURL" :src="currentUser.photoURL" referrerpolicy="no-referrer" class="w-6 h-6 rounded-full shrink-0" />
                <span class="flex-1 text-xs text-indigo-300 truncate">{{ currentUser.displayName || currentUser.email }}</span>
                <button type="button" class="text-xs text-indigo-400 hover:text-red-400 transition-colors shrink-0 cursor-pointer" @click="logout">Sign out</button>
              </template>
              <button v-else type="button" class="w-full text-left text-sm text-indigo-300 hover:text-blue-100 transition-colors cursor-pointer" @click="login">
                Sign in with Google
              </button>
            </div>
          </template>

          <template #settings-leading>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </template>

          <template #admin-leading>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </template>

          <template #edit-positions>
            <div class="flex items-center justify-between w-full gap-2">
              <span>Edit Positions</span>
              <USwitch :model-value="editPositions" @update:model-value="toggleEditPositions" />
            </div>
          </template>
        </UDropdownMenu>
      </div>
    </div>
  </nav>
</template>

<script setup>
const { editPositions, startEdit, saveEdit } = useMapState()
const { currentUser, isAdmin, login, logout } = useAuthState()
const route = useRoute()

const NAV_LINKS = [
  { to: '/', label: 'Map' },
  { to: '/shards', label: 'Shards' },
  { to: '/magic-systems', label: 'Magic Systems' },
]

// A toggle only has an on/off state, so there's no room for a separate
// Cancel (discard changes) action here — turning it off saves, same as the
// old sidebar button's Save action.
function toggleEditPositions() {
  if (editPositions.value) saveEdit()
  else startEdit()
}

// Prevent the dropdown from auto-closing when interacting with these rows —
// they're toggles/actions, not navigation, so the menu should stay open.
const stayOpen = { onSelect: (e) => e.preventDefault() }

const menuGroups = computed(() => {
  const groups = [[{ slot: 'account', ...stayOpen }]]

  const links = []
  if (currentUser.value) {
    links.push({ slot: 'settings', label: 'Settings', to: '/settings' })
    links.push({ slot: 'admin', label: 'Admin', to: '/admin' })
  }
  if (links.length) groups.push(links)

  if (route.path === '/' && isAdmin.value) {
    groups.push([{ slot: 'edit-positions', ...stayOpen }])
  }

  return groups
})
</script>
