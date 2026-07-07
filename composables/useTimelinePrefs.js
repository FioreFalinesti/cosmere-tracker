const TIMELINE_NEWEST_FIRST_KEY = 'cosmere-tracker:timeline-newest-first'
const timelineNewestFirst = ref(false)
let timelineOrderInitialized = false

const NUXT_UI_TIMELINE_KEY = 'cosmere-tracker:nuxt-ui-timeline'
const nuxtUiTimeline = ref(false)
let nuxtUiTimelineInitialized = false

export function useTimelinePrefs() {
  function initTimelineOrder() {
    if (timelineOrderInitialized) return
    try {
      timelineNewestFirst.value = localStorage.getItem(TIMELINE_NEWEST_FIRST_KEY) === 'true'
    } catch {
      timelineNewestFirst.value = false
    }
    timelineOrderInitialized = true
  }

  function setTimelineNewestFirst(value) {
    timelineNewestFirst.value = value
    localStorage.setItem(TIMELINE_NEWEST_FIRST_KEY, String(value))
  }

  // Whether the sidebar shows the original hand-built timeline list or the
  // UTimeline-based alternate — an experimental toggle for trying out Nuxt UI
  // components without committing to a full replacement of the original.
  function initNuxtUiTimeline() {
    if (nuxtUiTimelineInitialized) return
    try {
      nuxtUiTimeline.value = localStorage.getItem(NUXT_UI_TIMELINE_KEY) === 'true'
    } catch {
      nuxtUiTimeline.value = false
    }
    nuxtUiTimelineInitialized = true
  }

  function setNuxtUiTimeline(value) {
    nuxtUiTimeline.value = value
    localStorage.setItem(NUXT_UI_TIMELINE_KEY, String(value))
  }

  return {
    timelineNewestFirst, initTimelineOrder, setTimelineNewestFirst,
    nuxtUiTimeline, initNuxtUiTimeline, setNuxtUiTimeline,
  }
}
