<template>
  <aside class="w-64 shrink-0 border-r border-surface-700 bg-surface-900 h-full flex flex-col">
    <TimelineList v-if="showSidebarLists" />

    <!-- Edit positions — map page only -->
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
const { editPositions, initTimelineOrder, startEdit, saveEdit, cancelEdit } = useMapState()
const route = useRoute()

const SIDEBAR_LIST_PATHS = ['/', '/settings']
const showSidebarLists = computed(() => SIDEBAR_LIST_PATHS.includes(route.path))

initTimelineOrder()
</script>
