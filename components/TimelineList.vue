<template>
  <div class="flex-1 overflow-y-auto px-3 py-3">
    <div v-if="sortedEvents.length" class="relative ml-3 pl-3">
      <div class="absolute left-0 top-0 bottom-0 w-px bg-surface-700" />
      <div
        v-if="nowLineOffset > 0"
        class="absolute left-0 w-[3px] bg-accent-500/70 rounded-full"
        :style="timelineNewestFirst
          ? { top: `${nowLineOffset}px`, bottom: 0 }
          : { top: 0, height: `${nowLineOffset}px` }"
      />
      <div
        v-for="(ev, i) in sortedEvents"
        :key="ev.slug"
        :ref="el => { if (isCurrent(ev)) currentItemEl = el }"
        class="relative group cursor-pointer"
        :style="{ marginTop: i > 0 ? `${gapBefore(ev, sortedEvents[i - 1])}px` : 0 }"
        @click="setCurrentEvent(ev.slug)"
      >
        <span
          class="absolute -left-[15px] rounded-full transition-all"
          :class="[
            isCurrent(ev) ? 'ring-2 ring-accent-300 ring-offset-2 ring-offset-surface-900' : '',
            isRevealed(ev) ? 'bg-accent-500' : 'bg-surface-600',
            ev.event_type === 'range' ? 'top-0.5 w-1.5 h-4' : 'top-1.5 w-2 h-2',
          ]"
        />
        <div class="flex items-baseline gap-2">
          <span class="text-xs font-mono text-indigo-400 shrink-0 group-hover:text-accent-300 transition-colors">
            {{ ev.year_start != null ? ev.year_start : '—' }}{{ ev.event_type === 'range' && ev.year_end != null ? '–' + ev.year_end : '' }}
          </span>
          <span class="text-sm truncate group-hover:text-accent-300 transition-colors" :class="isRevealed(ev) ? 'text-blue-100' : 'text-indigo-400'">
            {{ ev.title }}
          </span>
          <span v-if="isCurrent(ev)" class="text-[10px] text-accent-300 uppercase tracking-widest shrink-0">Now</span>
        </div>
        <p v-if="ev.description" class="text-xs text-indigo-500 mt-0.5">{{ ev.description }}</p>
      </div>
    </div>
    <p v-else class="text-sm text-indigo-600 italic px-2">No timeline events yet.</p>
  </div>
</template>

<script setup>
const { orderedEvents, init: initEvents, currentEvent, nowYear, eventYear, initCurrentEvent, setCurrentEvent } = useTimelineEvents()
const { timelineNewestFirst } = useMapState()

await initEvents()
initCurrentEvent()

const sortedEvents = computed(() =>
  timelineNewestFirst.value ? [...orderedEvents.value].reverse() : orderedEvents.value
)

// Vertical gap between adjacent entries grows with their year difference —
// log-scaled so multi-century jumps don't blow out the list — falling back
// to the minimum for undated events, which have no year to compare.
const MIN_GAP = 8
const MAX_GAP = 96
const GAP_SCALE = 6
function gapBefore(ev, prevEv) {
  const year = eventYear(ev)
  const prevYear = eventYear(prevEv)
  if (year == null || prevYear == null) return MIN_GAP
  const diff = Math.abs(year - prevYear)
  if (diff === 0) return MIN_GAP
  return Math.min(MAX_GAP, MIN_GAP + Math.log2(diff + 1) * GAP_SCALE)
}

function isCurrent(ev) {
  return ev.slug === currentEvent.value?.slug
}

function isRevealed(ev) {
  const year = eventYear(ev)
  return year == null || year <= nowYear.value
}

// ── Thicker line connecting events before "now" ──────────────────────────
// The dot's vertical center sits 10px from its item's top for both instance
// and range markers (their top-offset + half-height both sum to 10px). In
// oldest-first order that's the top segment down to "now"; reversed, the
// earlier events are at the bottom, so the highlighted segment flips too.
const DOT_CENTER = 10
let currentItemEl = null
const nowLineOffset = ref(0)

function measureNowLine() {
  nowLineOffset.value = currentItemEl ? currentItemEl.offsetTop + DOT_CENTER : 0
}

watch([sortedEvents, currentEvent], () => nextTick(measureNowLine))
onMounted(() => {
  nextTick(measureNowLine)
  window.addEventListener('resize', measureNowLine)
})
onUnmounted(() => window.removeEventListener('resize', measureNowLine))
</script>
