<template>
  <aside
    v-if="hasContent"
    class="shrink-0 border-r border-surface-700 bg-surface-900 h-full flex flex-col overflow-hidden"
    :class="collapsed ? 'w-8' : ''"
    :style="collapsed ? {} : { width: `${SIDEBAR_WIDTH}px` }"
  >
    <div class="shrink-0 h-10 flex items-center">
      <button
        type="button"
        class="h-10 w-8 shrink-0 flex items-center justify-center text-lg font-bold text-indigo-500 hover:text-blue-100 hover:bg-surface-800 transition-colors cursor-pointer"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="collapsed = !collapsed"
      >{{ collapsed ? '»' : '«' }}</button>

      <UTabs
        v-if="!collapsed"
        v-model="view"
        :items="viewTabs"
        orientation="horizontal"
        variant="link"
        :content="false"
      />
    </div>

    <div v-if="!collapsed" class="flex-1 min-h-0 overflow-hidden">
      <div
        class="h-full flex w-[200%] transition-transform duration-300 ease-in-out"
        :style="{ transform: view === 'shards' ? 'translateX(-50%)' : 'translateX(0%)' }"
      >
        <div class="w-1/2 h-full min-h-0 flex flex-col overflow-hidden">
          <template v-if="showSidebarLists">
            <TimelineListUi v-if="nuxtUiTimeline" />
            <TimelineList v-else />
          </template>
        </div>
        <div class="w-1/2 h-full min-h-0 flex flex-col overflow-hidden">
          <ShardsList v-if="showSidebarLists" />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { SIDEBAR_WIDTH } from '~/composables/useMapState'

const { initTimelineOrder, nuxtUiTimeline, initNuxtUiTimeline } = useTimelinePrefs()
initNuxtUiTimeline()
const route = useRoute()

// Settings page has its own full editable event list — showing the read-only
// timeline here too would just duplicate it. /shards doesn't have its own
// way to change which event is "current", so it needs it.
const SIDEBAR_LIST_PATHS = ['/', '/shards']
const showSidebarLists = computed(() => SIDEBAR_LIST_PATHS.includes(route.path))
const hasContent = showSidebarLists

const collapsed = ref(false)
const view = ref('timeline')

const viewTabs = [
  { label: 'Timeline', value: 'timeline' },
  { label: 'Shards', value: 'shards' },
]

initTimelineOrder()
</script>
