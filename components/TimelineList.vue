<template>
  <div class="flex-1 overflow-y-auto px-3 py-3">
    <h2 class="text-sm font-semibold text-indigo-400 uppercase tracking-widest px-2 mb-3">Timeline</h2>
    <div v-if="sortedEvents.length" class="relative" :style="{ paddingLeft: `${CONTENT_LEFT}px` }">
      <div class="absolute top-0 bottom-0 w-px bg-surface-700" :style="{ left: `${SPINE_LEFT}px` }" />
      <div
        v-if="nowLineOffset > 0"
        class="absolute w-[3px] bg-accent-500/70 rounded-full"
        :style="timelineNewestFirst
          ? { left: `${SPINE_LEFT - 1}px`, top: `${nowLineOffset}px`, bottom: 0 }
          : { left: `${SPINE_LEFT - 1}px`, top: 0, height: `${nowLineOffset}px` }"
      />
      <div
        v-for="(ev, i) in sortedEvents"
        :key="ev.slug"
        :ref="el => setRowRef(ev, el)"
        class="relative group cursor-pointer rounded outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        :class="{ 'opacity-50': !isReached(ev) }"
        :style="{ marginTop: i > 0 ? `${gapBefore(ev, sortedEvents[i - 1])}px` : 0 }"
        role="button"
        tabindex="0"
        :aria-current="isCurrent(ev) ? 'true' : undefined"
        @click="setCurrentEvent(ev.slug)"
        @keydown.enter.prevent="setCurrentEvent(ev.slug)"
        @keydown.space.prevent="setCurrentEvent(ev.slug)"
      >
        <template v-if="ev.event_type === 'range'">
          <span
            class="absolute rounded-full"
            :class="isReached(ev) ? 'bg-accent-500/40' : 'bg-surface-700'"
            :style="rangeBarStyle(ev)"
          />
          <span
            class="absolute rounded-full border-2 bg-surface-900"
            :class="isReached(ev) ? 'border-accent-500' : 'border-surface-600'"
            :style="rangeStartCapStyle(ev)"
          />
          <span
            class="absolute rounded-full transition-all"
            :class="[
              isCurrent(ev) ? 'ring-2 ring-accent-300 ring-offset-2 ring-offset-surface-900' : '',
              isReached(ev) ? 'bg-accent-500' : 'bg-surface-600',
            ]"
            :style="markerDotStyle"
          />
          <!-- Range events show their text to the LEFT of the spine, vertically
               centered across the full span the bar covers — the row's own
               normal-flow content stays empty (spacing is driven entirely by
               gapBefore's marginTop, not rendered height). -->
          <div
            class="absolute flex flex-col justify-center items-end gap-0.5 text-right"
            :style="rangeTextStyle(ev)"
          >
            <span class="text-xs font-mono text-indigo-400 shrink-0 group-hover:text-accent-300 transition-colors">
              {{ ev.estimated ? '~' : '' }}{{ resolvedYearStart(ev) != null ? resolvedYearStart(ev) : '—' }}–{{ resolvedYearEnd(ev) != null ? resolvedYearEnd(ev) : '—' }}
            </span>
            <span
              class="text-sm group-hover:text-accent-300 transition-colors"
              :class="isReached(ev) ? 'text-blue-100' : 'text-indigo-400'"
              :title="ev.title"
            >
              {{ ev.title }}
            </span>
            <p v-if="ev.description" class="text-xs text-indigo-500">{{ ev.description }}</p>
            <div v-if="ev.entity_slugs?.length" class="flex flex-wrap justify-end gap-1">
              <span v-for="slug in ev.entity_slugs" :key="slug" class="text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-indigo-300">{{ entityName(slug) }}</span>
            </div>
          </div>
        </template>
        <template v-else>
          <span
            class="absolute rounded-full transition-all"
            :class="[
              isCurrent(ev) ? 'ring-2 ring-accent-300 ring-offset-2 ring-offset-surface-900' : '',
              isReached(ev) ? 'bg-accent-500' : 'bg-surface-600',
            ]"
            :style="markerDotStyle"
          />
          <div class="flex items-baseline gap-2">
            <span class="text-xs font-mono text-indigo-400 shrink-0 group-hover:text-accent-300 transition-colors">
              {{ ev.estimated ? '~' : '' }}{{ resolvedYearStart(ev) != null ? resolvedYearStart(ev) : '—' }}
            </span>
            <span
              class="text-sm truncate group-hover:text-accent-300 transition-colors"
              :class="isReached(ev) ? 'text-blue-100' : 'text-indigo-400'"
              :title="ev.title"
            >
              {{ ev.title }}
            </span>
          </div>
          <p v-if="ev.description" class="text-xs text-indigo-500 mt-0.5">{{ ev.description }}</p>
          <div v-if="ev.entity_slugs?.length" class="flex flex-wrap gap-1 mt-1">
            <span v-for="slug in ev.entity_slugs" :key="slug" class="text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-indigo-300">{{ entityName(slug) }}</span>
          </div>
        </template>
      </div>
    </div>
    <p v-else class="text-sm text-indigo-600 italic px-2">No timeline events yet.</p>
  </div>
</template>

<script setup>
const { orderedEvents, init: initEvents, currentEvent, eventYear, resolvedYearStart, resolvedYearEnd, isReached, initCurrentEvent, setCurrentEvent } = useTimelineEvents()
const { timelineNewestFirst } = useTimelinePrefs()
const { entities, init: initEntities } = useEntitySettings()

await initEvents()
initCurrentEvent()
initEntities()

function entityName(slug) {
  return entities.value.find(e => e.slug === slug)?.name ?? slug
}

const sortedEvents = computed(() =>
  timelineNewestFirst.value ? [...orderedEvents.value].reverse() : orderedEvents.value
)

// Vertical gap/bar length grows with year difference — log-scaled so
// multi-century jumps don't blow out the list — falling back to the minimum
// when there's no year to compare (undated events, or unresolved bounds).
const MIN_GAP = 8
const MAX_GAP = 96
const GAP_SCALE = 6
function yearGap(diff) {
  if (diff === 0) return MIN_GAP
  return Math.min(MAX_GAP, MIN_GAP + Math.log2(diff + 1) * GAP_SCALE)
}
function gapBefore(ev, prevEv) {
  const year = eventYear(ev)
  const prevYear = eventYear(prevEv)
  if (year == null || prevYear == null) return MIN_GAP
  return yearGap(Math.abs(year - prevYear))
}

// Layout: CONTENT_LEFT is where each row's own normal-flow content starts
// (the reserved gutter's total width). Everything else is derived from it so
// the spine ends up centered ON the dot, not aligned to the dot's left edge
// (its previous bug) — the dot keeps its existing -15px row-relative offset,
// and the spine is placed at the dot's horizontal CENTER.
const CONTENT_LEFT = 145
const MARKER_OFFSET = 15
const DOT_SIZE = 8
const DOT_LEFT = CONTENT_LEFT - MARKER_OFFSET
const SPINE_LEFT = DOT_LEFT + DOT_SIZE / 2 - 0.5
const RANGE_TEXT_WIDTH = SPINE_LEFT - 10

// The range bar/cap sit immediately to the LEFT of the spine, touching it —
// right next to the range's own text (also on the left) — while the shared
// end-dot marker stays centered on the spine (it serves instant events too,
// whose text is still on the right).
const RANGE_BAR_WIDTH = 6
const RANGE_MARKER_LEFT = (SPINE_LEFT - RANGE_BAR_WIDTH) - CONTENT_LEFT

// A range event's row sits at its END year's position in the sorted list
// (its effective year, used for sort/reveal, resolves to the end — "reached"
// once it concludes) — so the bar representing its span extends BACKWARD
// from this row toward where its start falls: upward when the list is
// oldest-first (earlier = higher up), downward when reversed.
const MARKER_TOP = 6

// The bar's height is the ACTUAL measured distance to whichever row's
// resolved year matches this range's start — not an independent log-scale
// estimate — so it lines up with reality even when other events sit between
// the two dates. Falls back to the log-scale estimate only when no row in
// the current list resolves to exactly that start year (e.g. nothing else
// happens to share that year) or before the first measurement pass runs.
const rangeSpanPx = ref({})
function rangeBarHeight(ev) {
  const measured = rangeSpanPx.value[ev.slug]
  if (measured != null && measured > 0) return measured
  const start = resolvedYearStart(ev)
  const end = resolvedYearEnd(ev)
  if (start == null || end == null) return MIN_GAP
  return yearGap(Math.abs(end - start))
}
function rangeBarStyle(ev) {
  const height = rangeBarHeight(ev)
  const top = timelineNewestFirst.value ? MARKER_TOP : MARKER_TOP - height
  return { left: `${RANGE_MARKER_LEFT}px`, top: `${top}px`, width: `${RANGE_BAR_WIDTH}px`, height: `${height}px` }
}
function rangeStartCapStyle(ev) {
  const height = rangeBarHeight(ev)
  const top = timelineNewestFirst.value ? MARKER_TOP + height : MARKER_TOP - height
  return { left: `${RANGE_MARKER_LEFT}px`, top: `${top}px`, width: `${RANGE_BAR_WIDTH}px`, height: `${RANGE_BAR_WIDTH}px` }
}

// Shared position/size for both the range-end and instant-event markers —
// keeps the visual dot in lockstep with MARKER_OFFSET/DOT_SIZE/MARKER_TOP,
// which SPINE_LEFT/DOT_CENTER are derived from below.
const markerDotStyle = { left: `-${MARKER_OFFSET}px`, top: `${MARKER_TOP}px`, width: `${DOT_SIZE}px`, height: `${DOT_SIZE}px` }

// The full bounding box of the bar + its end dot, used to vertically center
// the range's text across its whole visual span rather than just this row's
// own line. The bar's own top always matches this box's top; only the
// bottom differs (the dot extends DOT_SIZE past the bar in oldest-first
// mode, since the bar stops where the dot begins; in reversed mode the dot
// is a subset of the bar since bar height is always >= DOT_SIZE).
function rangeSpanStyle(ev) {
  const height = rangeBarHeight(ev)
  const top = timelineNewestFirst.value ? MARKER_TOP : MARKER_TOP - height
  const total = timelineNewestFirst.value ? height : height + DOT_SIZE
  return { top: `${top}px`, height: `${total}px` }
}
function rangeTextStyle(ev) {
  const span = rangeSpanStyle(ev)
  return { left: `-${CONTENT_LEFT}px`, width: `${RANGE_TEXT_WIDTH}px`, top: span.top, height: span.height }
}

function isCurrent(ev) {
  return ev.slug === currentEvent.value?.slug
}

// ── Thicker line connecting events before "now" ──────────────────────────
// The dot's vertical center sits 10px from its item's top for both instance
// and range markers (their top-offset + half-height both sum to 10px). In
// oldest-first order that's the top segment down to "now"; reversed, the
// earlier events are at the bottom, so the highlighted segment flips too.
const DOT_CENTER = 10
let currentItemEl = null
const nowLineOffset = ref(0)
const rowRefs = {}

function setRowRef(ev, el) {
  if (el) rowRefs[ev.slug] = el
  if (isCurrent(ev)) currentItemEl = el
}

function measureNowLine() {
  nowLineOffset.value = currentItemEl ? currentItemEl.offsetTop + DOT_CENTER : 0
}

// For each range event, find whichever row currently resolves to exactly
// its start year and measure the real pixel distance to it — offsetTop
// already bakes in every row's marginTop/height in between, so the raw
// difference is the correct span (both rows' markers sit DOT_CENTER px from
// their own row top, so that constant cancels out of the subtraction).
function measureRangeSpans() {
  const result = {}
  for (const ev of sortedEvents.value) {
    if (ev.event_type !== 'range') continue
    const startYear = resolvedYearStart(ev)
    if (startYear == null) continue
    const startRow = sortedEvents.value.find(e => e.slug !== ev.slug && eventYear(e) === startYear)
    const thisEl = rowRefs[ev.slug]
    const startEl = startRow ? rowRefs[startRow.slug] : null
    if (thisEl && startEl) {
      result[ev.slug] = Math.abs(thisEl.offsetTop - startEl.offsetTop)
    }
  }
  rangeSpanPx.value = result
}

function measureAll() {
  measureNowLine()
  measureRangeSpans()
}

watch([sortedEvents, currentEvent], () => nextTick(measureAll))
onMounted(() => {
  nextTick(() => {
    measureAll()
    currentItemEl?.scrollIntoView?.({ block: 'center' })
  })
  window.addEventListener('resize', measureAll)
})
onUnmounted(() => window.removeEventListener('resize', measureAll))
</script>
