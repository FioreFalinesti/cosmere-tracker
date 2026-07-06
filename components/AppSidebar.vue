<template>
  <aside
    v-if="hasContent"
    class="shrink-0 border-r border-surface-700 bg-surface-900 h-full flex flex-col"
    :class="collapsed ? 'w-8' : ''"
    :style="collapsed ? {} : { width: `${SIDEBAR_WIDTH}px` }"
  >
    <button
      class="shrink-0 h-8 flex items-center justify-center text-indigo-500 hover:text-blue-100 hover:bg-surface-800 transition-colors"
      :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="collapsed = !collapsed"
    >{{ collapsed ? '»' : '«' }}</button>

    <template v-if="!collapsed">
      <TimelineList v-if="showSidebarLists" />
    </template>
  </aside>
</template>

<script setup>
import { SIDEBAR_WIDTH } from '~/composables/useMapState'

const { initTimelineOrder } = useTimelinePrefs()
const route = useRoute()

// Settings page has its own full editable event list — showing the read-only
// timeline here too would just duplicate it. /shards and /characters don't
// have their own way to change which event is "current", so they need it.
const SIDEBAR_LIST_PATHS = ['/', '/shards', '/characters']
const showSidebarLists = computed(() => SIDEBAR_LIST_PATHS.includes(route.path))
const hasContent = showSidebarLists

const collapsed = ref(false)

initTimelineOrder()
</script>
