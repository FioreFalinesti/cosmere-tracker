<template>
  <div class="max-w-2xl">
    <h1 class="text-3xl font-bold text-blue-50 mb-8">Settings</h1>

    <section class="mb-10">
      <h2 class="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">Timeline</h2>
      <div class="flex items-center gap-3">
        <span class="text-sm" :class="!timelineNewestFirst ? 'text-blue-100' : 'text-indigo-400'">Oldest on top</span>
        <button
          type="button"
          class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
          :class="timelineNewestFirst ? 'bg-accent-600' : 'bg-surface-700'"
          @click="setTimelineNewestFirst(!timelineNewestFirst)"
        >
          <span
            class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
            :class="timelineNewestFirst ? 'translate-x-4' : 'translate-x-1'"
          />
        </button>
        <span class="text-sm" :class="timelineNewestFirst ? 'text-blue-100' : 'text-indigo-400'">Newest on top</span>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">Timeline Events</h2>
      <div class="space-y-3">
        <TimelineEventForm
          :draft="newDraft"
          :books="books"
          :systems="systems"
          :planets="planets"
          submit-label="Add Event"
          :status="addEventStatus"
          :error="addEventError"
          @submit="doAddEvent"
        />

        <div class="space-y-1 pt-2 border-t border-surface-700">
          <template v-for="(ev, i) in orderedEvents" :key="ev.slug">
            <div v-if="editingSlug === ev.slug" class="py-3 border-b border-surface-700">
              <TimelineEventForm
                :draft="editDraft"
                :books="books"
                :systems="systems"
                :planets="planets"
                submit-label="Save"
                :show-cancel="true"
                :status="editStatus"
                :error="editError"
                @submit="saveEditEvent"
                @cancel="cancelEditEvent"
              />
            </div>
            <div v-else class="py-1">
              <div class="flex items-center gap-2">
                <div class="flex flex-col shrink-0">
                  <button class="text-indigo-500 hover:text-blue-100 disabled:opacity-30 disabled:hover:text-indigo-500 leading-none transition-colors" :disabled="i === 0" @click="moveEvent(ev.slug, -1)">▲</button>
                  <button class="text-indigo-500 hover:text-blue-100 disabled:opacity-30 disabled:hover:text-indigo-500 leading-none transition-colors" :disabled="i === orderedEvents.length - 1" @click="moveEvent(ev.slug, 1)">▼</button>
                </div>
                <span class="text-xs font-mono text-indigo-400 w-24 shrink-0">{{ ev.year_start != null ? ev.year_start : '—' }}{{ ev.event_type === 'range' && ev.year_end != null ? '–' + ev.year_end : '' }}</span>
                <span class="flex-1 text-sm text-blue-100 truncate">{{ ev.title }}</span>
                <span v-if="ev.book_slug" class="text-xs text-indigo-500 truncate">{{ bookTitle(ev.book_slug) }}</span>
                <button class="text-xs text-indigo-400 hover:text-blue-100 transition-colors shrink-0" @click="startEditEvent(ev)">Edit</button>
                <button class="text-red-400 hover:text-red-300 text-lg leading-none transition-colors shrink-0" @click="deleteTimelineEvent(ev.slug)">×</button>
              </div>
              <p v-if="ev.description" class="text-xs text-indigo-500 mt-0.5 ml-[4.5rem]">{{ ev.description }}</p>
            </div>
          </template>
          <p v-if="!orderedEvents.length" class="text-sm text-indigo-600 italic">No events yet.</p>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">Admin</h2>
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="cloneSource"
            class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 focus:outline-none focus:border-accent-500 transition-colors">
            <option value="" disabled>Source system…</option>
            <option v-for="s in sortedSystems" :key="s.slug" :value="s.slug">{{ s.name }} ({{ s.slug }})</option>
          </select>
          <input v-model="cloneNewSlug" type="text" placeholder="new-slug"
            class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-44" />
          <input v-model="cloneNewName" type="text" placeholder="New Name"
            class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-44" />
          <button
            class="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            :disabled="!cloneSource || !cloneNewSlug || !cloneNewName || cloneStatus === 'running'"
            @click="doClone"
          >Clone System</button>
          <span v-if="cloneStatus === 'done'" class="text-sm text-green-400">Done</span>
          <span v-else-if="cloneStatus === 'error'" class="text-sm text-red-400">{{ cloneError }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const { systems, init, cloneSystem } = useSystemSettings()
const { planets, init: initPlanets } = usePlanetSettings()
const { books, load: loadBooks } = useCosmere()
const { orderedEvents, init: initEvents, addTimelineEvent, updateTimelineEvent, deleteTimelineEvent, moveEvent } = useTimelineEvents()
const { timelineNewestFirst, initTimelineOrder, setTimelineNewestFirst } = useMapState()
await Promise.all([init(), initPlanets(), loadBooks(), initEvents()])
initTimelineOrder()

const cloneSource = ref('')
const cloneNewSlug = ref('')
const cloneNewName = ref('')
const cloneStatus = ref('idle')
const cloneError = ref('')

const sortedSystems = computed(() =>
  [...systems.value].sort((a, b) => a.name.localeCompare(b.name))
)

async function doClone() {
  cloneStatus.value = 'running'
  cloneError.value = ''
  try {
    await cloneSystem(cloneSource.value, cloneNewSlug.value.trim(), cloneNewName.value.trim())
    cloneStatus.value = 'done'
  } catch (e) {
    cloneError.value = e.message
    cloneStatus.value = 'error'
  }
}

function bookTitle(slug) {
  return books.value.find(b => b.slug === slug)?.title ?? slug
}

function emptyDraft() {
  return { type: 'instance', title: '', yearStart: '', yearEnd: '', bookSlug: '', systemSlug: '', planetSlug: '', description: '', orbitEventIds: [] }
}

function draftToPatch(draft) {
  return {
    title: draft.title.trim() || (draft.bookSlug ? bookTitle(draft.bookSlug) : ''),
    description: draft.description.trim(),
    event_type: draft.type,
    year_start: draft.yearStart === '' ? null : Number(draft.yearStart),
    year_end: draft.type === 'range' ? Number(draft.yearEnd) : null,
    book_slug: draft.bookSlug || null,
    planet_slug: draft.planetSlug || null,
    system_slug: draft.systemSlug || null,
    orbit_event_ids: draft.orbitEventIds ?? [],
  }
}

const newDraft = reactive(emptyDraft())
const addEventStatus = ref('idle')
const addEventError = ref('')

async function doAddEvent() {
  addEventStatus.value = 'running'
  addEventError.value = ''
  try {
    await addTimelineEvent(draftToPatch(newDraft))
    Object.assign(newDraft, emptyDraft())
    addEventStatus.value = 'done'
  } catch (e) {
    addEventError.value = e.message
    addEventStatus.value = 'error'
  }
}

const editingSlug = ref(null)
const editDraft = reactive(emptyDraft())
const editStatus = ref('idle')
const editError = ref('')

function startEditEvent(ev) {
  editingSlug.value = ev.slug
  Object.assign(editDraft, {
    type: ev.event_type,
    title: ev.title,
    yearStart: ev.year_start ?? '',
    yearEnd: ev.year_end ?? '',
    bookSlug: ev.book_slug ?? '',
    systemSlug: ev.system_slug ?? '',
    planetSlug: ev.planet_slug ?? '',
    description: ev.description ?? '',
    orbitEventIds: [...(ev.orbit_event_ids ?? [])],
  })
  editStatus.value = 'idle'
  editError.value = ''
}

function cancelEditEvent() {
  editingSlug.value = null
}

async function saveEditEvent() {
  editStatus.value = 'running'
  editError.value = ''
  try {
    await updateTimelineEvent(editingSlug.value, draftToPatch(editDraft))
    editingSlug.value = null
  } catch (e) {
    editError.value = e.message
    editStatus.value = 'error'
  }
}
</script>
