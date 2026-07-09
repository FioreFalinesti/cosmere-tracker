<template>
  <aside
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
          <TimelineListUi />
        </div>
        <div class="w-1/2 h-full min-h-0 flex flex-col overflow-hidden">
          <ShardsList />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { SIDEBAR_WIDTH } from '~/composables/useMapState'

const { initTimelineOrder } = useTimelinePrefs()

const collapsed = ref(false)
const view = ref('timeline')

const viewTabs = [
  { label: 'Timeline', value: 'timeline' },
  { label: 'Shards', value: 'shards' },
]

initTimelineOrder()
</script>
