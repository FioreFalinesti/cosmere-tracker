const TIMELINE_NEWEST_FIRST_KEY = 'cosmere-tracker:timeline-newest-first'
const timelineNewestFirst = ref(false)
let timelineOrderInitialized = false

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

  return { timelineNewestFirst, initTimelineOrder, setTimelineNewestFirst }
}
