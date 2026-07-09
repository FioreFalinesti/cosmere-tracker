<template>
  <div>
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-blue-50 mb-1">Shards</h1>
        <p class="text-indigo-400 text-sm">
          {{ entities.length }} entities · status reflects the current timeline selection
        </p>
      </div>
      <button
        v-if="isAdmin"
        type="button"
        class="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-700 hover:bg-surface-600 text-indigo-300 hover:text-blue-100 transition-colors"
        @click="editing = !editing"
      >
        {{ editing ? "Done" : "Edit" }}
      </button>
    </div>

    <div v-if="editing" class="mb-8 bg-surface-800 border border-surface-700 rounded-xl p-4">
      <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">
        Add Entity
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="newEntityDraft.slug"
          type="text"
          placeholder="slug"
          class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-32"
        />
        <input
          v-model="newEntityDraft.name"
          type="text"
          placeholder="Name"
          class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-40"
        />
        <select
          v-model="newEntityDraft.type"
          class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
        >
          <option value="shard">Shard</option>
          <option value="entity">Entity</option>
          <option value="splinter-remnant">Splinter Remnant</option>
        </select>
        <input
          v-model="newEntityDraft.status"
          type="text"
          placeholder="Initial status"
          class="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors w-32"
        />
        <button
          class="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          :disabled="!newEntityDraft.slug.trim() || !newEntityDraft.name.trim()"
          @click="doAddEntity"
        >
          Add
        </button>
        <span v-if="addEntityStatus === 'error'" class="text-sm text-red-400">
          {{ addEntityError }}
        </span>
      </div>
    </div>

    <div v-for="group in groupedEntities" :key="group.type" class="mb-8">
      <h2 class="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-3">
        {{ group.label }}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="entity in group.items"
          :key="entity.slug"
          class="bg-surface-800 border border-surface-700 rounded-xl p-4"
          :class="{ 'opacity-50': isEntityDead(entity) }"
        >
          <template v-if="editing">
            <input
              v-model="entity.name"
              type="text"
              placeholder="Name"
              @change="setEntityName(entity.slug, entity.name)"
              class="w-full bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-sm font-semibold text-blue-50 mb-2 focus:outline-none focus:border-accent-500 transition-colors"
            />
            <div class="flex items-center gap-2 mb-2">
              <div
                class="w-4 h-4 rounded-full shrink-0 border border-surface-600"
                :style="{ background: entity.color || '#888888' }"
              />
              <span class="text-xs font-mono text-indigo-500 shrink-0">#</span>
              <input
                :value="(entity.color || '').replace('#', '')"
                type="text"
                maxlength="6"
                placeholder="rrggbb"
                @change="onColorChange(entity, $event.target.value)"
                class="w-24 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
              />
            </div>
            <input
              v-model="entity.status"
              type="text"
              placeholder="Status"
              @change="setEntityStatus(entity.slug, entity.status)"
              class="w-full bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-indigo-300 mb-2 focus:outline-none focus:border-accent-500 transition-colors"
            />
            <textarea
              v-model="entity.description"
              placeholder="Description"
              rows="2"
              @change="setEntityDescription(entity.slug, entity.description)"
              class="w-full bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-blue-200 mb-2 focus:outline-none focus:border-accent-500 transition-colors"
            />
            <input
              v-model="entity.current_holder"
              type="text"
              placeholder="Current holder"
              @change="setEntityHolder(entity.slug, entity.current_holder)"
              class="w-full bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-indigo-300 mb-2 focus:outline-none focus:border-accent-500 transition-colors"
            />
            <select
              :value="entity.splinter_remnant_slug ?? ''"
              @change="setEntitySplinterRemnant(entity.slug, $event.target.value)"
              class="w-full bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-indigo-300 mb-3 focus:outline-none focus:border-accent-500 transition-colors"
            >
              <option value="">No splinter remnant</option>
              <option
                v-for="other in entities.filter((e) => e.slug !== entity.slug)"
                :key="other.slug"
                :value="other.slug"
              >
                {{ other.name }}
              </option>
            </select>

            <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">
              Status Events
            </p>
            <div
              v-for="se in entity.status_events ?? []"
              :key="se.id"
              class="flex items-center gap-1.5 mb-1.5"
            >
              <select
                :value="triggerFor(se.id)?.slug ?? ''"
                @change="onTriggerChange(entity, se.id, $event.target.value)"
                class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-1.5 py-1 text-xs text-indigo-200 focus:outline-none focus:border-accent-500 transition-colors"
              >
                <option value="">Unlinked</option>
                <option v-for="te in orderedEvents" :key="te.slug" :value="te.slug">
                  {{ te.title || "Untitled" }}
                </option>
              </select>
              <span class="text-xs text-indigo-400 shrink-0">→ {{ se.status_after }}</span>
              <button
                class="text-red-400 hover:text-red-300 text-lg leading-none transition-colors shrink-0"
                @click="deleteStatusEvent(entity, se.id)"
              >
                ×
              </button>
            </div>
            <div class="flex items-center gap-1.5">
              <input
                v-model="draftFor(entity.slug).status"
                type="text"
                placeholder="new status"
                class="w-24 bg-surface-700 border border-surface-600 rounded px-1.5 py-1 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
              />
              <select
                v-model="draftFor(entity.slug).eventSlug"
                class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-1.5 py-1 text-xs text-indigo-200 focus:outline-none focus:border-accent-500 transition-colors"
              >
                <option value="">Trigger event…</option>
                <option v-for="te in orderedEvents" :key="te.slug" :value="te.slug">
                  {{ te.title || "Untitled" }}
                </option>
              </select>
              <button
                class="px-2 py-1 bg-accent-600 hover:bg-accent-500 text-white text-xs rounded transition-colors disabled:opacity-50"
                :disabled="!draftFor(entity.slug).status.trim() || !draftFor(entity.slug).eventSlug"
                @click="addStatusEvent(entity)"
              >
                Add
              </button>
            </div>

            <template v-if="entity.type === 'shard' || entity.type === 'splinter-remnant'">
              <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-1.5 mt-3">
                Location
              </p>
              <select
                :value="entity.location_slug ?? ''"
                @change="setEntityLocation(entity.slug, $event.target.value)"
                class="w-full bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-indigo-300 mb-1.5 focus:outline-none focus:border-accent-500 transition-colors"
              >
                <option value="">Unknown</option>
                <option v-for="sys in systems" :key="sys.slug" :value="sys.slug">
                  {{ sys.name }}
                </option>
              </select>
              <div
                v-for="le in entity.location_events ?? []"
                :key="le.id"
                class="flex items-center gap-1.5 mb-1.5"
              >
                <select
                  :value="triggerFor(le.id)?.slug ?? ''"
                  @change="onTriggerChange(entity, le.id, $event.target.value)"
                  class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-1.5 py-1 text-xs text-indigo-200 focus:outline-none focus:border-accent-500 transition-colors"
                >
                  <option value="">Unlinked</option>
                  <option v-for="te in orderedEvents" :key="te.slug" :value="te.slug">
                    {{ te.title || "Untitled" }}
                  </option>
                </select>
                <span class="text-xs text-indigo-400 shrink-0">→ {{ systemName(le.location_after) }}</span>
                <button
                  class="text-red-400 hover:text-red-300 text-lg leading-none transition-colors shrink-0"
                  @click="deleteLocationEvent(entity, le.id)"
                >
                  ×
                </button>
              </div>
              <div class="flex items-center gap-1.5">
                <select
                  v-model="locationDraftFor(entity.slug).locationSlug"
                  class="w-28 shrink-0 bg-surface-700 border border-surface-600 rounded px-1.5 py-1 text-xs text-indigo-200 focus:outline-none focus:border-accent-500 transition-colors"
                >
                  <option value="">new location…</option>
                  <option v-for="sys in systems" :key="sys.slug" :value="sys.slug">
                    {{ sys.name }}
                  </option>
                </select>
                <select
                  v-model="locationDraftFor(entity.slug).eventSlug"
                  class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-1.5 py-1 text-xs text-indigo-200 focus:outline-none focus:border-accent-500 transition-colors"
                >
                  <option value="">Trigger event…</option>
                  <option v-for="te in orderedEvents" :key="te.slug" :value="te.slug">
                    {{ te.title || "Untitled" }}
                  </option>
                </select>
                <button
                  class="px-2 py-1 bg-accent-600 hover:bg-accent-500 text-white text-xs rounded transition-colors disabled:opacity-50"
                  :disabled="!locationDraftFor(entity.slug).locationSlug || !locationDraftFor(entity.slug).eventSlug"
                  @click="addLocationEvent(entity)"
                >
                  Add
                </button>
              </div>
            </template>
          </template>
          <template v-else>
            <div class="flex items-center justify-between gap-2 mb-1">
              <div class="flex items-center gap-2 min-w-0">
                <ShardIcon v-if="entity.type === 'shard' && entity.color" :color="entity.color" :size="35" class="shrink-0" />
                <span
                  v-else
                  class="w-3 h-3 rounded-full shrink-0"
                  :class="entity.color ? '' : 'bg-surface-600'"
                  :style="entity.color ? { background: entity.color } : {}"
                />
                <h3 class="font-semibold text-blue-50 truncate">{{ entity.name }}</h3>
              </div>
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-surface-700 text-indigo-300 shrink-0"
              >
                {{ statusOf(entity) }}
              </span>
            </div>
            <p v-if="entity.current_holder" class="text-xs text-indigo-400 mb-1">
              Held by {{ entity.current_holder }}
            </p>
            <p v-if="entity.description" class="text-sm text-blue-200 mb-2">
              {{ entity.description }}
            </p>
            <p v-if="entity.splinter_remnant_slug" class="text-xs text-indigo-400 mb-2">
              Splintered into {{ entityName(entity.splinter_remnant_slug) }}
            </p>
            <div
              v-if="eventsFor(entity).length"
              class="flex flex-wrap gap-1 mt-2 pt-2 border-t border-surface-700"
            >
              <span
                v-for="ev in eventsFor(entity)"
                :key="ev.slug"
                class="text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-indigo-300"
              >
                {{ ev.title }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <p v-if="!entities.length" class="text-indigo-400 text-center py-12">No entities yet.</p>
  </div>
</template>

<script setup>
import { resolveStatus, TERMINAL_SHARD_STATUSES, NOT_YET_FORMED_SHARD_STATUSES } from "~/utils/timelineFieldResolvers";
import { isValidHexColor } from "~/utils/colorUtils";

const {
  entities,
  init: initEntities,
  createEntity,
  setEntityName,
  setEntityStatus,
  setEntityDescription,
  setEntityHolder,
  setEntitySplinterRemnant,
  setEntityStatusEvents,
  setEntityColor,
  setEntityLocation,
  setEntityLocationEvents,
} = useEntitySettings();
const {
  events: timelineEvents,
  orderedEvents,
  init: initEvents,
  eventYear,
  updateTimelineEvent,
} = useTimelineEvents();
const { systems, init: initSystems } = useSystemSettings();
const { isAdmin } = useAuthState();

await initEntities();
await initEvents();
await initSystems();

const editing = ref(false);

const TYPE_ORDER = ["entity", "shard", "splinter-remnant"];
const TYPE_LABELS = {
  entity: "Entities",
  shard: "Shards",
  "splinter-remnant": "Splinter Remnants",
};
const groupedEntities = computed(() =>
  TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: entities.value
      .filter((e) => e.type === type)
      .filter((e) => editing.value || !isNotYetFormed(e))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length),
);

function statusOf(entity) {
  return resolveStatus(entity.status_events ?? [], entity.status);
}

// Mirrors the (now-removed) Characters page's "deceased" treatment: a Shard
// that's splintered/destroyed/combined is no longer a distinct active Shard,
// but still shown (dimmed) rather than hidden outright.
function isEntityDead(entity) {
  return TERMINAL_SHARD_STATUSES.includes(statusOf(entity));
}

// Unlike "dead", a not-yet-formed entity (e.g. Harmony pre-Catacendre) hasn't
// been introduced in-story at all, so it's hidden entirely rather than
// dimmed — except in Edit mode, where an admin still needs access to configure it.
function isNotYetFormed(entity) {
  return NOT_YET_FORMED_SHARD_STATUSES.includes(statusOf(entity));
}

function entityName(slug) {
  return entities.value.find((e) => e.slug === slug)?.name ?? slug;
}

function systemName(slug) {
  return systems.value.find((s) => s.slug === slug)?.name ?? slug;
}

function onColorChange(entity, hex) {
  if (!isAdmin.value) return;
  const normalized = "#" + hex.replace("#", "");
  if (!isValidHexColor(normalized)) return;
  setEntityColor(entity.slug, normalized);
}

// Derived, not stored — an entity's "appears in" list always reflects
// whichever timeline events currently reference it via entity_slugs, so it
// can't drift out of sync with the events themselves.
function eventsFor(entity) {
  return timelineEvents.value
    .filter((e) => (e.entity_slugs ?? []).includes(entity.slug))
    .sort((a, b) => (eventYear(a) ?? 0) - (eventYear(b) ?? 0));
}

function triggerFor(statusEventId) {
  return timelineEvents.value.find((e) => (e.orbit_event_ids ?? []).includes(statusEventId));
}

async function onTriggerChange(entity, statusEventId, newEventSlug) {
  if (!isAdmin.value) return;
  const currentlyLinked = timelineEvents.value.filter((e) =>
    (e.orbit_event_ids ?? []).includes(statusEventId),
  );
  await Promise.all(
    currentlyLinked.map((e) =>
      updateTimelineEvent(e.slug, {
        orbit_event_ids: e.orbit_event_ids.filter((id) => id !== statusEventId),
      }),
    ),
  );
  if (!newEventSlug) return;
  const target = timelineEvents.value.find((e) => e.slug === newEventSlug);
  if (target)
    await updateTimelineEvent(newEventSlug, {
      orbit_event_ids: [...(target.orbit_event_ids ?? []), statusEventId],
    });
}

const statusDrafts = reactive({});
function draftFor(slug) {
  if (!statusDrafts[slug]) statusDrafts[slug] = { status: "", eventSlug: "" };
  return statusDrafts[slug];
}

async function addStatusEvent(entity) {
  if (!isAdmin.value) return;
  const draft = draftFor(entity.slug);
  const status = draft.status.trim();
  if (!status || !draft.eventSlug) return;
  const id = crypto.randomUUID();
  await setEntityStatusEvents(entity.slug, [
    ...(entity.status_events ?? []),
    { id, status_after: status },
  ]);
  const target = timelineEvents.value.find((e) => e.slug === draft.eventSlug);
  if (target)
    await updateTimelineEvent(draft.eventSlug, {
      orbit_event_ids: [...(target.orbit_event_ids ?? []), id],
    });
  draft.status = "";
  draft.eventSlug = "";
}

async function deleteStatusEvent(entity, id) {
  if (!isAdmin.value) return;
  await setEntityStatusEvents(
    entity.slug,
    (entity.status_events ?? []).filter((se) => se.id !== id),
  );
  const referencing = timelineEvents.value.filter((e) => (e.orbit_event_ids ?? []).includes(id));
  await Promise.all(
    referencing.map((e) =>
      updateTimelineEvent(e.slug, {
        orbit_event_ids: e.orbit_event_ids.filter((oid) => oid !== id),
      }),
    ),
  );
}

const locationDrafts = reactive({});
function locationDraftFor(slug) {
  if (!locationDrafts[slug]) locationDrafts[slug] = { locationSlug: "", eventSlug: "" };
  return locationDrafts[slug];
}

async function addLocationEvent(entity) {
  if (!isAdmin.value) return;
  const draft = locationDraftFor(entity.slug);
  if (!draft.locationSlug || !draft.eventSlug) return;
  const id = crypto.randomUUID();
  await setEntityLocationEvents(entity.slug, [
    ...(entity.location_events ?? []),
    { id, location_after: draft.locationSlug },
  ]);
  const target = timelineEvents.value.find((e) => e.slug === draft.eventSlug);
  if (target)
    await updateTimelineEvent(draft.eventSlug, {
      orbit_event_ids: [...(target.orbit_event_ids ?? []), id],
    });
  draft.locationSlug = "";
  draft.eventSlug = "";
}

async function deleteLocationEvent(entity, id) {
  if (!isAdmin.value) return;
  await setEntityLocationEvents(
    entity.slug,
    (entity.location_events ?? []).filter((le) => le.id !== id),
  );
  const referencing = timelineEvents.value.filter((e) => (e.orbit_event_ids ?? []).includes(id));
  await Promise.all(
    referencing.map((e) =>
      updateTimelineEvent(e.slug, {
        orbit_event_ids: e.orbit_event_ids.filter((oid) => oid !== id),
      }),
    ),
  );
}

const newEntityDraft = reactive({ slug: "", name: "", type: "shard", status: "unknown" });
const addEntityStatus = ref("idle");
const addEntityError = ref("");
async function doAddEntity() {
  if (!isAdmin.value) return;
  addEntityStatus.value = "running";
  addEntityError.value = "";
  try {
    await createEntity(
      newEntityDraft.slug.trim(),
      newEntityDraft.name.trim(),
      newEntityDraft.type,
      newEntityDraft.status.trim() || "unknown",
    );
    Object.assign(newEntityDraft, { slug: "", name: "", type: "shard", status: "unknown" });
    addEntityStatus.value = "done";
  } catch (e) {
    addEntityError.value = `Failed to add entity: ${e.message}`;
    addEntityStatus.value = "error";
  }
}
</script>
