<template>
  <!-- System panel -->
  <Transition name="panel">
    <div
      v-if="selectedSystem && !selectedPlanet && selectedBodyMemberIndex === null"
      class="absolute top-0 right-0 h-full w-1/5 bg-surface-900 border-l border-surface-700 z-10 flex flex-col"
    >
      <!-- Header: system name editable -->
      <div class="flex items-center gap-2 px-4 py-3 border-b border-surface-700 shrink-0 min-h-[52px]">
        <template v-if="systemNameEditing">
          <input ref="systemNameInputRef" v-model="systemNameDraft" type="text"
            class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-2 py-1 text-sm font-semibold text-blue-50 focus:outline-none focus:border-accent-500 transition-colors"
            @keydown.enter="saveSystemName" @keydown.escape="systemNameEditing = false" />
          <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveSystemName">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </button>
          <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="systemNameEditing = false">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </template>
        <template v-else>
          <h2 class="flex-1 min-w-0 text-base font-semibold text-blue-50 truncate cursor-pointer hover:text-accent-300 transition-colors" @click="startSystemNameEdit">{{ selectedSystem.name }}</h2>
          <button class="text-indigo-400 hover:text-blue-100 transition-colors p-1 -mr-1 shrink-0" @click="selectedSystemSlug = null">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </template>
      </div>

      <div class="flex-1 overflow-y-auto">

        <!-- Star section -->
        <div class="px-5 py-4 border-b border-surface-700">
          <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">Star</p>

          <div class="flex items-center gap-2 py-1.5">
            <span class="text-xs text-indigo-400 uppercase tracking-widest shrink-0 w-14">Name</span>
            <div class="flex-1 flex items-center justify-end gap-1.5 min-w-0">
              <template v-if="starNameEditing">
                <input v-model="starNameDraft" type="text" placeholder="Star name…"
                  class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-2 py-0.5 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveStarName" @keydown.escape="starNameEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveStarName"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="starNameEditing = false"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </template>
              <button v-else class="text-sm truncate transition-colors text-right"
                :class="selectedSystem.star_name ? 'text-blue-100 hover:text-accent-300' : 'text-indigo-600 italic hover:text-indigo-400'"
                @click="startStarNameEdit">{{ selectedSystem.star_name || 'Not set' }}</button>
            </div>
          </div>

          <div class="flex items-center gap-2 py-1.5">
            <span class="text-xs text-indigo-400 uppercase tracking-widest shrink-0 w-14">Color</span>
            <div class="flex-1 flex items-center justify-end gap-2 min-w-0">
              <div class="w-3.5 h-3.5 rounded-full shrink-0"
                :style="{ background: starColorEditing ? starColorDraft : (selectedSystem.star_color ?? '#ffcc44'), boxShadow: `0 0 5px 1px ${starColorEditing ? starColorDraft : (selectedSystem.star_color ?? '#ffcc44')}55` }" />
              <template v-if="starColorEditing">
                <span class="text-xs font-mono text-indigo-500 shrink-0">#</span>
                <input v-model="starColorDraft" type="text" maxlength="6" placeholder="ffcc44"
                  class="w-20 bg-surface-700 border border-surface-600 rounded px-2 py-0.5 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveStarColor" @keydown.escape="starColorEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveStarColor"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="starColorEditing = false"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </template>
              <button v-else class="text-xs font-mono text-blue-100 hover:text-accent-300 transition-colors" @click="startStarColorEdit">{{ selectedSystem.star_color ?? '#ffcc44' }}</button>
            </div>
          </div>

          <div class="flex items-center gap-2 py-1.5">
            <span class="text-xs text-indigo-400 uppercase tracking-widest shrink-0 w-14">Size</span>
            <div class="flex-1 flex items-center justify-end gap-1.5 min-w-0">
              <template v-if="starSizeEditing">
                <input v-model="starSizeDraft" type="number" step="0.05" min="0.05"
                  class="w-20 bg-surface-700 border border-surface-600 rounded px-2 py-0.5 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveStarSize" @keydown.escape="starSizeEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveStarSize"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="starSizeEditing = false"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </template>
              <button v-else class="text-sm font-mono text-blue-100 hover:text-accent-300 transition-colors" @click="startStarSizeEdit">×{{ selectedSystem.star_size ?? 1 }}</button>
            </div>
          </div>

          <div class="flex items-center justify-between py-1.5">
            <span class="text-xs text-indigo-400 uppercase tracking-widest">Particulate Ring</span>
            <button class="relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none"
              :class="selectedSystem.star_particulate_ring ? 'bg-accent-600' : 'bg-surface-600'"
              @click="setStarParticulateRing(selectedSystem.slug, !selectedSystem.star_particulate_ring)">
              <span class="inline-block w-3 h-3 bg-white rounded-full shadow transition-transform" :class="selectedSystem.star_particulate_ring ? 'translate-x-5' : 'translate-x-1'" />
            </button>
          </div>

        </div>

        <!-- Members section -->
        <div class="px-5 py-4">
          <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">Members</p>

          <!-- Column header -->
          <div class="flex items-center justify-end gap-1.5 mb-1">
            <span class="text-[10px] text-indigo-600 uppercase tracking-widest w-16 text-center shrink-0">Dist</span>
            <div class="w-4 shrink-0" />
          </div>

          <div class="space-y-1 mb-4">
            <div v-for="(member, mi) in (selectedSystem.members ?? [])" :key="mi" class="flex items-center gap-1.5">
              <template v-if="member.type === 'planet'">
                <div class="w-2 h-2 rounded-full shrink-0"
                  :style="{ background: planetBySlug(member.slug)?.color }" />
                <button class="flex-1 text-sm text-left truncate transition-colors"
                  :class="planetBySlug(member.slug)?.uninhabited ? 'text-indigo-500 italic' : 'text-blue-100 hover:text-accent-400'"
                  @click="selectedPlanetSlug = member.slug; selectedSystemSlug = null; zoomTarget = { type: 'planet', slug: member.slug }">
                  {{ planetBySlug(member.slug)?.name ?? member.slug }}
                </button>
                <input
                  type="number" step="10" min="0" placeholder="auto"
                  :value="planetBySlug(member.slug)?.orbit_distance ?? ''"
                  @change="onPlanetOrbitChange(member.slug, $event)"
                  class="w-16 bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-xs font-mono text-blue-100 placeholder-indigo-700 focus:outline-none focus:border-accent-500 transition-colors shrink-0"
                />
                <select v-if="(selectedSystem.members ?? []).some(m => typeof m === 'object' && m.type === 'star')"
                  :value="member.lagrange_point ?? ''"
                  @change="onLagrangeChange(mi, $event)"
                  class="bg-surface-700 border border-surface-600 rounded px-1 py-0.5 text-xs text-indigo-300 focus:outline-none focus:border-accent-500 shrink-0 transition-colors">
                  <option value="">Free</option>
                  <option value="1">L1</option>
                  <option value="2">L2</option>
                  <option value="3">L3</option>
                  <option value="4">L4</option>
                  <option value="5">L5</option>
                </select>
              </template>
              <template v-else>
                <button class="text-xs text-indigo-500 uppercase tracking-wide shrink-0 hover:text-indigo-300 transition-colors" @click="selectedBodyMemberIndex = mi">{{ bodyLabel(member.type) }}</button>
                <template v-if="systemBodyNameEditing === mi">
                  <input v-model="systemBodyNameDraft" type="text" :placeholder="`${bodyLabel(member.type)} name…`"
                    class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                    @keydown.enter="saveSystemBodyName(mi)" @keydown.escape="systemBodyNameEditing = null" />
                  <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveSystemBodyName(mi)"><svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                  <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="systemBodyNameEditing = null"><svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </template>
                <button v-else class="flex-1 text-sm text-left truncate transition-colors"
                  :class="member.name ? 'text-indigo-300 hover:text-blue-100' : 'text-indigo-600 italic hover:text-indigo-400'"
                  @click="selectedBodyMemberIndex = mi">{{ member.name || 'Unnamed' }}</button>
                <input
                  type="number" step="10" min="0" placeholder="auto"
                  :value="member.orbit_distance ?? ''"
                  @change="onBodyOrbitChange(mi, $event)"
                  class="w-16 bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-xs font-mono text-blue-100 placeholder-indigo-700 focus:outline-none focus:border-accent-500 transition-colors shrink-0"
                />
              </template>
              <div class="flex gap-0.5 shrink-0">
                <button class="text-indigo-500 hover:text-blue-100 disabled:opacity-30 px-0.5 text-xs transition-colors" :disabled="mi === 0" @click="moveSystemMember(mi, -1)">↑</button>
                <button class="text-indigo-500 hover:text-blue-100 disabled:opacity-30 px-0.5 text-xs transition-colors" :disabled="mi === (selectedSystem.members ?? []).length - 1" @click="moveSystemMember(mi, 1)">↓</button>
                <button class="text-red-400 hover:text-red-300 px-0.5 text-sm transition-colors" @click="removeSystemMember(mi)">×</button>
              </div>
            </div>
            <p v-if="!(selectedSystem.members ?? []).length" class="text-sm text-indigo-600 italic">None</p>
          </div>

          <!-- Add controls -->
          <div class="space-y-2">
            <div class="flex gap-2">
              <input v-model="newPlanetName" type="text" placeholder="New planet name…"
                class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                @keydown.enter="addSystemPlanet" />
              <button class="px-3 py-1.5 bg-accent-600 hover:bg-accent-500 text-white text-xs rounded-lg transition-colors shrink-0" @click="addSystemPlanet">Add</button>
            </div>
            <div class="flex gap-2">
              <select v-model="newBodyType" class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-blue-100 focus:outline-none focus:border-accent-500 transition-colors">
                <option v-for="opt in bodyTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <button class="px-3 py-1.5 bg-surface-600 hover:bg-surface-500 text-blue-100 text-xs rounded-lg transition-colors shrink-0" @click="addSystemBody">Add Body</button>
            </div>
            <div v-if="newBodyType === 'star'" class="flex gap-2">
              <input v-model="newStarBodyName" type="text" placeholder="Star name (optional)…"
                class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                @keydown.enter="addSystemBody" />
            </div>
          </div>
        </div>

        <!-- Wiki section -->
        <div class="px-5 py-4 border-t border-surface-700">
          <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">Wiki</p>
          <template v-if="systemWikiEditing">
            <div class="flex items-center gap-2">
              <input ref="systemWikiInputRef" v-model="systemWikiDraft" type="url" placeholder="https://coppermind.net/wiki/…"
                class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                @keydown.enter="saveSystemWiki" @keydown.escape="systemWikiEditing = false" />
              <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveSystemWiki"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
              <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="systemWikiEditing = false"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </template>
          <template v-else>
            <a v-if="selectedSystem.wiki" :href="selectedSystem.wiki" target="_blank" rel="noopener noreferrer"
              class="text-xs text-accent-400 hover:text-accent-300 transition-colors truncate block mb-2">{{ selectedSystem.wiki }}</a>
            <button class="text-xs text-indigo-500 hover:text-indigo-300 transition-colors" @click="startSystemWikiEdit">
              {{ selectedSystem.wiki ? 'Edit link' : 'Set wiki link…' }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Body member panel -->
  <Transition name="panel">
    <div
      v-if="selectedSystem && selectedBodyMember && !selectedPlanet"
      class="absolute top-0 right-0 h-full w-1/5 bg-surface-900 border-l border-surface-700 z-10 flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center gap-2 px-4 py-3 border-b border-surface-700 shrink-0 min-h-[52px]">
        <button class="text-indigo-400 hover:text-blue-100 transition-colors shrink-0 p-1 -ml-1" @click="selectedBodyMemberIndex = null" title="Back to system">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <template v-if="systemBodyNameEditing === selectedBodyMemberIndex">
          <input v-model="systemBodyNameDraft" type="text"
            class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-2 py-1 text-sm font-semibold text-blue-50 focus:outline-none focus:border-accent-500 transition-colors"
            @keydown.enter="saveSystemBodyName(selectedBodyMemberIndex)" @keydown.escape="systemBodyNameEditing = null" />
          <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveSystemBodyName(selectedBodyMemberIndex)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </button>
          <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="systemBodyNameEditing = null">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </template>
        <template v-else>
          <div class="flex-1 min-w-0">
            <p class="text-[10px] text-indigo-500 uppercase tracking-widest">{{ bodyLabel(selectedBodyMember.type) }}</p>
            <h2 class="text-sm font-semibold text-blue-50 truncate cursor-pointer hover:text-accent-300 transition-colors leading-tight"
              @click="startSystemBodyNameEdit(selectedBodyMemberIndex, selectedBodyMember.name ?? '')">
              {{ selectedBodyMember.name || 'Unnamed' }}
            </h2>
          </div>
          <button class="text-indigo-400 hover:text-blue-100 transition-colors p-1 -mr-1 shrink-0" @click="selectedBodyMemberIndex = null; selectedSystemSlug = null">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </template>
      </div>

      <div class="flex-1 overflow-y-auto">
        <!-- Star / Anomaly appearance fields -->
        <template v-if="selectedBodyMember.type === 'star' || selectedBodyMember.type === 'anomaly'">
          <div class="px-5 py-4 border-b border-surface-700">
            <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">Appearance</p>

            <div class="flex items-center gap-2 py-1.5">
              <span class="text-xs text-indigo-400 uppercase tracking-widest shrink-0 w-14">Color</span>
              <div class="flex-1 flex items-center justify-end gap-2 min-w-0">
                <div class="w-3.5 h-3.5 rounded-full shrink-0"
                  :style="{ background: bodyColorEditing ? '#' + bodyColorDraft : (selectedBodyMember.color ?? '#bb88ff'), boxShadow: `0 0 5px 1px ${bodyColorEditing ? '#' + bodyColorDraft : (selectedBodyMember.color ?? '#bb88ff')}55` }" />
                <template v-if="bodyColorEditing">
                  <span class="text-xs font-mono text-indigo-500 shrink-0">#</span>
                  <input v-model="bodyColorDraft" type="text" maxlength="6" placeholder="bb88ff"
                    class="w-20 bg-surface-700 border border-surface-600 rounded px-2 py-0.5 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                    @keydown.enter="saveBodyColor" @keydown.escape="bodyColorEditing = false" />
                  <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveBodyColor"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                  <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="bodyColorEditing = false"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </template>
                <button v-else class="text-xs font-mono text-blue-100 hover:text-accent-300 transition-colors" @click="startBodyColorEdit">{{ selectedBodyMember.color ?? '#bb88ff' }}</button>
              </div>
            </div>

            <div class="flex items-center gap-2 py-1.5">
              <span class="text-xs text-indigo-400 uppercase tracking-widest shrink-0 w-14">Size</span>
              <div class="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                <template v-if="bodySizeEditing">
                  <input v-model="bodySizeDraft" type="number"
                    :step="selectedBodyMember.type === 'star' ? 0.05 : 10"
                    :min="selectedBodyMember.type === 'star' ? 0.05 : 10"
                    class="w-20 bg-surface-700 border border-surface-600 rounded px-2 py-0.5 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                    @keydown.enter="saveBodySize" @keydown.escape="bodySizeEditing = false" />
                  <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveBodySize"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                  <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="bodySizeEditing = false"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </template>
                <button v-else class="text-sm font-mono text-blue-100 hover:text-accent-300 transition-colors" @click="startBodySizeEdit">
                  {{ selectedBodyMember.type === 'star' ? `×${selectedBodyMember.size ?? 0.5}` : `${selectedBodyMember.size ?? 60}px` }}
                </button>
              </div>
            </div>
            <div v-if="selectedBodyMember.type === 'star'" class="flex items-center justify-between py-1.5">
              <span class="text-xs text-indigo-400 uppercase tracking-widest">Particulate Ring</span>
              <button class="relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none"
                :class="selectedBodyMember.particulate_ring ? 'bg-accent-600' : 'bg-surface-600'"
                @click="setSystemBodyParticulateRing(selectedSystem.slug, selectedBodyMemberIndex, !selectedBodyMember.particulate_ring)">
                <span class="inline-block w-3 h-3 bg-white rounded-full shadow transition-transform"
                  :class="selectedBodyMember.particulate_ring ? 'translate-x-5' : 'translate-x-1'" />
              </button>
            </div>
          </div>
        </template>

        <!-- Orbit section -->
        <div class="px-5 py-4">
          <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">Orbit</p>

          <div class="flex items-center gap-2 py-1.5">
            <span class="text-xs text-indigo-400 uppercase tracking-widest shrink-0 w-14">Distance</span>
            <div class="flex-1 flex items-center justify-end gap-1.5 min-w-0">
              <template v-if="bodyOrbitEditing">
                <input v-model="bodyOrbitDraft" type="number" step="10" min="0" placeholder="Auto"
                  class="w-20 bg-surface-700 border border-surface-600 rounded px-2 py-0.5 text-xs font-mono text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveBodyOrbit" @keydown.escape="bodyOrbitEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveBodyOrbit"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="bodyOrbitEditing = false"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </template>
              <template v-else>
                <button class="text-sm font-mono transition-colors"
                  :class="selectedBodyMember.orbit_distance != null ? 'text-blue-100 hover:text-accent-300' : 'text-indigo-600 italic hover:text-indigo-400'"
                  @click="startBodyOrbitEdit">{{ selectedBodyMember.orbit_distance != null ? `${selectedBodyMember.orbit_distance}px` : 'Auto' }}</button>
                <button v-if="selectedBodyMember.orbit_distance != null"
                  class="text-indigo-600 hover:text-red-400 text-xs leading-none transition-colors" title="Reset to auto"
                  @click="async () => { await setSystemBodyOrbitDistance(selectedSystem.slug, selectedBodyMemberIndex, null) }">×</button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Planet panel -->
  <Transition name="panel">
    <div
      v-if="selectedPlanet"
      class="absolute top-0 right-0 h-full w-1/5 bg-surface-900 border-l border-surface-700 z-10 flex flex-col"
    >
      <!-- Header: planet name editable -->
      <div class="flex items-center gap-2 px-4 py-3 border-b border-surface-700 shrink-0 min-h-[52px]">
        <template v-if="planetNameEditing">
          <input ref="planetNameInputRef" v-model="planetNameDraft" type="text"
            class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-2 py-1 text-sm font-semibold text-blue-50 focus:outline-none focus:border-accent-500 transition-colors"
            @keydown.enter="savePlanetName" @keydown.escape="planetNameEditing = false" />
          <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="savePlanetName">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </button>
          <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="planetNameEditing = false">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </template>
        <template v-else>
          <h2 class="flex-1 min-w-0 text-base font-semibold text-blue-50 truncate cursor-pointer hover:text-accent-300 transition-colors" @click="startPlanetNameEdit">{{ selectedPlanet.name }}</h2>
          <button class="text-indigo-400 hover:text-blue-100 transition-colors p-1 -mr-1 shrink-0" @click="selectedPlanetSlug = null">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </template>
      </div>

      <div class="flex-1 overflow-y-auto">

        <!-- Appearance section -->
        <div class="px-5 py-4 border-b border-surface-700">
          <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">Appearance</p>

          <div class="flex items-center gap-2 py-1.5">
            <span class="text-xs text-indigo-400 uppercase tracking-widest shrink-0 w-14">Color</span>
            <div class="flex-1 flex items-center justify-end gap-2 min-w-0">
              <div class="w-3.5 h-3.5 rounded-full shrink-0"
                :style="{ background: colorEditing ? colorDraft : selectedPlanet.color, boxShadow: `0 0 5px 1px ${colorEditing ? colorDraft : selectedPlanet.color}55` }" />
              <template v-if="colorEditing">
                <span class="text-xs font-mono text-indigo-500 shrink-0">#</span>
                <input ref="hexInputRef" v-model="colorDraft" type="text" maxlength="6" placeholder="000000"
                  class="w-20 bg-surface-700 border border-surface-600 rounded px-2 py-0.5 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveColor" @keydown.escape="colorEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveColor"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="colorEditing = false"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </template>
              <button v-else class="text-xs font-mono text-blue-100 hover:text-accent-300 transition-colors" @click="startColorEdit">{{ selectedPlanet.color }}</button>
            </div>
          </div>

          <div class="py-1.5">
            <span class="text-xs text-indigo-400 uppercase tracking-widest block mb-2">Type</span>
            <div class="flex gap-1">
              <button v-for="opt in planetTypeOptions" :key="opt.value"
                class="flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors"
                :class="planetType === opt.value ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-400 hover:text-blue-100'"
                @click="setPlanetType(opt.value)">{{ opt.label }}</button>
            </div>
          </div>

          <div class="flex items-center gap-2 py-1.5">
            <span class="text-xs text-indigo-400 uppercase tracking-widest shrink-0">Size <span class="normal-case">(cosmere standard)</span></span>
            <div class="flex-1 flex items-center justify-end gap-1.5 min-w-0">
              <template v-if="planetType === 'dwarf_planet'">
                <span class="text-sm font-mono text-indigo-600">×0.4</span>
                <span class="text-xs text-indigo-600 italic">locked</span>
              </template>
              <template v-else-if="sizeEditing">
                <input v-model="sizeDraft" type="number" step="0.1" min="0.01"
                  class="w-20 bg-surface-700 border border-surface-600 rounded px-2 py-0.5 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveSize" @keydown.escape="sizeEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveSize"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="sizeEditing = false"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </template>
              <button v-else class="text-sm font-mono text-blue-100 hover:text-accent-300 transition-colors" @click="startSizeEdit">×{{ selectedPlanet.size_multiplier ?? 1 }}</button>
            </div>
          </div>

          <div class="flex items-center justify-between py-1.5">
            <span class="text-xs text-indigo-400 uppercase tracking-widest">Uninhabited</span>
            <span v-if="planetType !== 'normal'" class="text-xs text-indigo-600 italic">Auto</span>
            <button v-else class="relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none"
              :class="selectedPlanet.uninhabited ? 'bg-accent-600' : 'bg-surface-600'"
              @click="setUninhabited(selectedPlanet.slug, !selectedPlanet.uninhabited)">
              <span class="inline-block w-3 h-3 bg-white rounded-full shadow transition-transform" :class="selectedPlanet.uninhabited ? 'translate-x-5' : 'translate-x-1'" />
            </button>
          </div>
        </div>

        <!-- Orbit section -->
        <div class="px-5 py-4 border-b border-surface-700">
          <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">Orbit</p>

          <div class="flex items-center gap-2 py-1.5">
            <span class="text-xs text-indigo-400 uppercase tracking-widest shrink-0 w-14">Distance</span>
            <div class="flex-1 flex items-center justify-end gap-1.5 min-w-0">
              <template v-if="orbitDistanceEditing">
                <input v-model="orbitDistanceDraft" type="number" step="10" min="0" placeholder="Auto"
                  class="w-20 bg-surface-700 border border-surface-600 rounded px-2 py-0.5 text-xs font-mono text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveOrbitDistance" @keydown.escape="orbitDistanceEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveOrbitDistance"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="orbitDistanceEditing = false"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </template>
              <template v-else>
                <button class="text-sm font-mono transition-colors"
                  :class="selectedPlanet.orbit_distance != null ? 'text-blue-100 hover:text-accent-300' : 'text-indigo-600 italic hover:text-indigo-400'"
                  @click="startOrbitDistanceEdit">{{ selectedPlanet.orbit_distance != null ? `${selectedPlanet.orbit_distance}px` : 'Auto' }}</button>
                <button v-if="selectedPlanet.orbit_distance != null"
                  class="text-indigo-600 hover:text-red-400 text-xs leading-none transition-colors" title="Reset to auto"
                  @click="setOrbitDistance(selectedPlanet.slug, null)">×</button>
              </template>
            </div>
          </div>

        </div>

        <!-- Moons section -->
        <div class="px-5 py-4 border-b border-surface-700">
          <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">Satellites</p>

          <div class="space-y-2 mb-3">
            <div v-for="(moon, mi) in (selectedPlanet.moons ?? [])" :key="moon" class="space-y-0.5">
              <!-- Row 1: name / rename + type select + remove -->
              <div class="flex items-center gap-1.5">
                <template v-if="moonRenaming === mi">
                  <input v-model="moonRenameDraft" type="text"
                    class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-xs text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                    @keydown.enter="saveMoonRename(moon, mi)" @keydown.escape="moonRenaming = null" />
                  <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveMoonRename(moon, mi)"><svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                  <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="moonRenaming = null"><svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </template>
                <button v-else
                  class="flex-1 min-w-0 text-sm text-left text-indigo-200 truncate hover:text-blue-100 transition-colors"
                  @click="startMoonRename(moon, mi)">{{ moon }}</button>
                <select
                  :value="getSatelliteType(selectedPlanet, moon)"
                  @change="setSatelliteType(selectedPlanet.slug, moon, $event.target.value)"
                  class="bg-surface-700 border border-surface-600 rounded px-1 py-0.5 text-xs text-indigo-300 focus:outline-none focus:border-accent-500 shrink-0 transition-colors">
                  <option value="moon">Moon</option>
                  <option value="ring">Ring</option>
                </select>
                <button class="text-red-400 hover:text-red-300 text-lg leading-none transition-colors shrink-0"
                  @click="updateMoons(selectedPlanet.slug, (selectedPlanet.moons ?? []).filter(m => m !== moon))">×</button>
              </div>
              <!-- Row 2: orbit + type-specific controls -->
              <div class="flex items-center gap-1.5 pl-2">
                <span class="text-xs text-indigo-500 shrink-0">orbit</span>
                <input type="number" step="10" min="0" placeholder="auto"
                  :value="(selectedPlanet.moon_orbit_distances ?? {})[moon] ?? ''"
                  @change="onMoonOrbitChange(moon, $event)"
                  class="w-16 bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-xs font-mono text-blue-100 placeholder-indigo-700 focus:outline-none focus:border-accent-500 transition-colors shrink-0" />
                <button v-if="(selectedPlanet.moon_orbit_distances ?? {})[moon] != null"
                  class="text-indigo-600 hover:text-red-400 text-xs leading-none transition-colors shrink-0"
                  title="Reset to auto"
                  @click="onMoonOrbitChange(moon, { target: { value: '0' } })">×</button>
                <!-- Moon: orbit type -->
                <select v-if="getSatelliteType(selectedPlanet, moon) === 'moon'"
                  :value="getMoonOrbitType(selectedPlanet, moon)"
                  @change="onMoonOrbitTypeChange(moon, $event)"
                  class="bg-surface-700 border border-surface-600 rounded px-1 py-0.5 text-xs text-indigo-300 focus:outline-none focus:border-accent-500 shrink-0 transition-colors">
                  <option value="standard">Standard</option>
                  <option value="polar">Polar</option>
                  <option value="eccentric-a">Oblate</option>
                  <option value="eccentric-c">Eccentric</option>
                </select>
                <!-- Ring: thickness + tilt -->
                <template v-else-if="getSatelliteType(selectedPlanet, moon) === 'ring'">
                  <span class="text-xs text-indigo-500 shrink-0">thick</span>
                  <input type="number" step="1" min="1" placeholder="auto"
                    :value="(selectedPlanet.satellite_thicknesses ?? {})[moon] ?? ''"
                    @change="onSatelliteThicknessChange(moon, $event)"
                    class="w-14 bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-xs font-mono text-blue-100 placeholder-indigo-700 focus:outline-none focus:border-accent-500 transition-colors shrink-0" />
                  <span class="text-xs text-indigo-500 shrink-0">tilt</span>
                  <input type="number" step="5" placeholder="0°"
                    :value="(selectedPlanet.satellite_tilts ?? {})[moon] ?? ''"
                    @change="onSatelliteTiltChange(moon, $event)"
                    class="w-14 bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-xs font-mono text-blue-100 placeholder-indigo-700 focus:outline-none focus:border-accent-500 transition-colors shrink-0" />
                </template>
              </div>
            </div>
            <p v-if="!(selectedPlanet.moons ?? []).length" class="text-sm text-indigo-600 italic">None</p>
          </div>
          <div class="flex gap-2">
            <input v-model="newMoonName" type="text" placeholder="Moon name…"
              class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
              @keydown.enter="addPanelMoon" />
            <button class="px-3 py-1 bg-accent-600 hover:bg-accent-500 text-white text-xs rounded-lg transition-colors" @click="addPanelMoon">Add</button>
          </div>
        </div>

        <!-- Timeline Events section -->
        <div class="px-5 py-4 border-b border-surface-700">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Orbit Events</p>
            <button class="text-xs text-indigo-500 hover:text-indigo-300 transition-colors" @click="orbitEventsEditing = !orbitEventsEditing">
              {{ orbitEventsEditing ? 'Done' : 'Edit' }}
            </button>
          </div>
          <div class="space-y-1.5 mb-2">
            <div v-for="ev in (selectedPlanet.orbit_events ?? [])" :key="ev.id" class="space-y-1">
              <div class="flex items-center gap-2">
                <span v-if="!orbitEventsEditing" class="flex-1 text-[11px] text-indigo-500 truncate">{{ triggerLabel(ev.id) }}</span>
                <select v-else :value="triggerSelectValue(ev.id)" @change="onTriggerChange(ev.id, $event)"
                  class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-[11px] text-indigo-200 focus:outline-none focus:border-accent-500 transition-colors">
                  <option value="">Unlinked</option>
                  <option v-for="te in eligibleTimelineEvents" :key="te.slug" :value="te.slug">{{ te.title || `Untitled (${te.year_start ?? '—'})` }}</option>
                  <option value="__new__">+ New event…</option>
                </select>
                <button v-if="orbitEventsEditing" class="text-red-400 hover:text-red-300 text-lg leading-none transition-colors shrink-0" @click="deleteOrbitEvent(ev.id)">×</button>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <template v-if="ev.color_after != null">
                  <div class="w-3 h-3 rounded-full shrink-0" :style="{ background: ev.color_before }" />
                  <span class="text-xs text-indigo-600 shrink-0">→</span>
                  <div class="w-3 h-3 rounded-full shrink-0" :style="{ background: ev.color_after }" />
                </template>
                <span v-if="ev.orbit_after != null" class="text-xs font-mono text-indigo-400 shrink-0">{{ ev.orbit_before ?? 'auto' }}px → {{ ev.orbit_after }}px</span>
              </div>
              <div v-if="creatingEventFor === ev.id" class="pl-2 border-l-2 border-accent-600/40 space-y-1.5">
                <div class="flex gap-1">
                  <button type="button" class="flex-1 px-2 py-1 text-[10px] rounded transition-colors"
                    :class="newLinkedEventDraft.type === 'instance' ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-400 hover:text-blue-100'"
                    @click="newLinkedEventDraft.type = 'instance'">Instance</button>
                  <button type="button" class="flex-1 px-2 py-1 text-[10px] rounded transition-colors"
                    :class="newLinkedEventDraft.type === 'range' ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-400 hover:text-blue-100'"
                    @click="newLinkedEventDraft.type = 'range'">Range</button>
                </div>
                <div class="flex gap-1.5">
                  <input v-model="newLinkedEventDraft.yearStart" type="number" :placeholder="newLinkedEventDraft.type === 'range' ? 'Start' : 'Year'"
                    class="w-16 bg-surface-700 border border-surface-600 rounded px-1.5 py-1 text-[11px] font-mono text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors" />
                  <input v-if="newLinkedEventDraft.type === 'range'" v-model="newLinkedEventDraft.yearEnd" type="number" placeholder="End"
                    class="w-16 bg-surface-700 border border-surface-600 rounded px-1.5 py-1 text-[11px] font-mono text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors" />
                  <input v-model="newLinkedEventDraft.title" type="text" placeholder="Title (optional)"
                    class="flex-1 min-w-0 bg-surface-700 border border-surface-600 rounded px-1.5 py-1 text-[11px] text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors" />
                </div>
                <div class="flex gap-2">
                  <button class="flex-1 px-2 py-1 bg-accent-600 hover:bg-accent-500 text-white text-[10px] rounded transition-colors disabled:opacity-50"
                    :disabled="newLinkedEventDraft.yearStart === ''"
                    @click="createLinkedEvent(ev.id)">Create &amp; Link</button>
                  <button type="button" class="px-2 py-1 bg-surface-700 hover:bg-surface-600 text-indigo-300 text-[10px] rounded transition-colors"
                    @click="creatingEventFor = null">Cancel</button>
                </div>
              </div>
              <div v-if="orbitEventsEditing" class="flex justify-end">
                <div class="inline-flex rounded overflow-hidden">
                  <button class="px-2 py-0.5 text-[10px] transition-colors"
                    :class="isPreviewing(ev.id, false) ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-400 hover:text-blue-100'"
                    @click="setPreview(ev.id, false)">Before</button>
                  <button class="px-2 py-0.5 text-[10px] transition-colors"
                    :class="isPreviewing(ev.id, true) ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-400 hover:text-blue-100'"
                    @click="setPreview(ev.id, true)">After</button>
                </div>
              </div>
            </div>
            <p v-if="!(selectedPlanet.orbit_events ?? []).length" class="text-sm text-indigo-600 italic">None</p>
          </div>
          <div v-if="orbitEventsEditing" class="space-y-2 mt-2">
            <label class="flex items-center gap-2 text-xs text-indigo-300 cursor-pointer">
              <input v-model="newEventHasOrbit" type="checkbox" class="accent-accent-600" />
              Orbit Distance
            </label>
            <template v-if="newEventHasOrbit">
              <div class="flex gap-2 items-center pl-5">
                <span class="text-xs text-indigo-400 w-12 shrink-0">Before</span>
                <input v-model="newEventOrbitBefore" type="number" step="10" min="0" placeholder="auto"
                  class="w-20 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors" />
              </div>
              <div class="flex gap-2 items-center pl-5">
                <span class="text-xs text-indigo-400 w-12 shrink-0">After</span>
                <input v-model="newEventOrbitAfter" type="number" step="10" min="0" placeholder="px"
                  class="w-20 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors" />
              </div>
            </template>
            <label class="flex items-center gap-2 text-xs text-indigo-300 cursor-pointer">
              <input v-model="newEventHasColor" type="checkbox" class="accent-accent-600" />
              Color
            </label>
            <template v-if="newEventHasColor">
              <div class="flex gap-2 items-center pl-5">
                <span class="text-xs text-indigo-400 w-12 shrink-0">Before</span>
                <div v-if="newEventColorBefore" class="w-4 h-4 rounded-full shrink-0" :style="{ background: '#' + newEventColorBefore }" />
                <span class="text-xs font-mono text-indigo-500 shrink-0">#</span>
                <input v-model="newEventColorBefore" type="text" maxlength="6" placeholder="rrggbb"
                  class="w-24 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors" />
              </div>
              <div class="flex gap-2 items-center pl-5">
                <span class="text-xs text-indigo-400 w-12 shrink-0">After</span>
                <div v-if="newEventColorAfter" class="w-4 h-4 rounded-full shrink-0" :style="{ background: '#' + newEventColorAfter }" />
                <span class="text-xs font-mono text-indigo-500 shrink-0">#</span>
                <input v-model="newEventColorAfter" type="text" maxlength="6" placeholder="rrggbb"
                  class="w-24 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors" />
              </div>
            </template>
            <button class="w-full px-3 py-1 bg-accent-600 hover:bg-accent-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
              :disabled="!newEventHasOrbit && !newEventHasColor" @click="addOrbitEvent">Add</button>
          </div>
        </div>

        <!-- Wiki section -->
        <div class="px-5 py-4">
          <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">Wiki</p>
          <template v-if="wikiEditing">
            <div class="flex items-center gap-2">
              <input ref="wikiInputRef" v-model="wikiDraft" type="url" placeholder="https://coppermind.net/wiki/…"
                class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                @keydown.enter="saveWiki" @keydown.escape="wikiEditing = false" />
              <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveWiki"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></button>
              <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="wikiEditing = false"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </template>
          <template v-else>
            <a v-if="selectedPlanet.wiki" :href="selectedPlanet.wiki" target="_blank" rel="noopener noreferrer"
              class="text-xs text-accent-400 hover:text-accent-300 transition-colors truncate block mb-2">{{ selectedPlanet.wiki }}</a>
            <button class="text-xs text-indigo-500 hover:text-indigo-300 transition-colors" @click="startWikiEdit">
              {{ selectedPlanet.wiki ? 'Edit link' : 'Set wiki link…' }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { getSatelliteType, getMoonOrbitType } from '~/utils/satelliteUtils'

const { planets, setPlanetName, setColor, setWiki, setSizeMultiplier, setUninhabited, setGasGiant, setDwarfPlanet, setOrbitDistance, setTimelineEvents, setMoonOrbitDistances, setMoonOrbitType, setSatelliteType, setSatelliteThickness, setSatelliteTilt, createPlanet, updateMoons, renameMoon } = usePlanetSettings()
const { systems, updateSystemMembers, setSystemName, setSystemBodyName, setSystemBodyParticulateRing, setSystemBodySize, setSystemBodyColor, setSystemBodyOrbitDistance, setSystemWiki, setStarName, setStarColor, setStarSize, setStarParticulateRing, setMemberLagrangePoint } = useSystemSettings()
const { selectedPlanetSlug, selectedSystemSlug, selectedBodyMemberIndex, zoomTarget, orbitEventPreview } = useMapState()
const { events: timelineEvents, orderedEvents, addTimelineEvent, updateTimelineEvent } = useTimelineEvents()

// ── Derived state ────────────────────────────────────────────────────────────

const selectedSystem = computed(() =>
  systems.value.find(s => s.slug === selectedSystemSlug.value) ?? null
)

const selectedBodyMember = computed(() =>
  selectedBodyMemberIndex.value !== null
    ? (selectedSystem.value?.members ?? [])[selectedBodyMemberIndex.value] ?? null
    : null
)

const selectedPlanet = computed(() =>
  planets.value.find(p => p.slug === selectedPlanetSlug.value) ?? null
)

// ── Helper functions ──────────────────────────────────────────────────────────

function planetBySlug(slug) {
  return planets.value.find(p => p.slug === slug)
}

const bodyTypeOptions = [
  { value: 'asteroid_belt', label: 'Asteroid Belt' },
  { value: 'comet_belt', label: 'Comet Belt' },
  { value: 'star', label: 'Star' },
  { value: 'anomaly', label: 'Anomaly' },
]

const planetTypeOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'gas_giant', label: 'Gas Giant' },
  { value: 'dwarf_planet', label: 'Dwarf Planet' },
]

function bodyLabel(type) {
  return bodyTypeOptions.find(o => o.value === type)?.label ?? type
}

const planetType = computed(() => {
  if (selectedPlanet.value?.is_gas_giant) return 'gas_giant'
  if (selectedPlanet.value?.is_dwarf_planet) return 'dwarf_planet'
  return 'normal'
})

// ── System name editing ───────────────────────────────────────────────────────

const systemNameEditing = ref(false)
const systemNameDraft = ref('')
const systemNameInputRef = ref(null)
watch(selectedSystemSlug, () => { systemNameEditing.value = false })
function startSystemNameEdit() {
  systemNameDraft.value = selectedSystem.value?.name ?? ''
  systemNameEditing.value = true
  nextTick(() => systemNameInputRef.value?.focus())
}
async function saveSystemName() {
  const name = systemNameDraft.value.trim()
  if (name) await setSystemName(selectedSystem.value.slug, name)
  systemNameEditing.value = false
}

// ── Star editing ──────────────────────────────────────────────────────────────

const starNameEditing = ref(false)
const starNameDraft = ref('')
const starColorEditing = ref(false)
const starColorDraft = ref('')
const starSizeEditing = ref(false)
const starSizeDraft = ref('')
watch(selectedSystemSlug, () => {
  starNameEditing.value = false
  starColorEditing.value = false
  starSizeEditing.value = false
})
function startStarNameEdit() {
  starNameDraft.value = selectedSystem.value?.star_name ?? ''
  starNameEditing.value = true
}
async function saveStarName() {
  await setStarName(selectedSystem.value.slug, starNameDraft.value.trim())
  starNameEditing.value = false
}
function startStarColorEdit() {
  starColorDraft.value = (selectedSystem.value?.star_color ?? '#ffcc44').replace('#', '')
  starColorEditing.value = true
}
async function saveStarColor() {
  const hex = '#' + starColorDraft.value
  if (/^#[0-9a-f]{6}$/i.test(hex)) await setStarColor(selectedSystem.value.slug, hex)
  starColorEditing.value = false
}
function startStarSizeEdit() {
  starSizeDraft.value = String(selectedSystem.value?.star_size ?? 1)
  starSizeEditing.value = true
}
async function saveStarSize() {
  const val = parseFloat(starSizeDraft.value)
  if (!isNaN(val) && val > 0) await setStarSize(selectedSystem.value.slug, val)
  starSizeEditing.value = false
}

// ── System wiki editing ───────────────────────────────────────────────────────

const systemWikiEditing = ref(false)
const systemWikiDraft = ref('')
const systemWikiInputRef = ref(null)
watch(selectedSystemSlug, () => { systemWikiEditing.value = false })
function startSystemWikiEdit() {
  systemWikiDraft.value = selectedSystem.value?.wiki ?? ''
  systemWikiEditing.value = true
  nextTick(() => systemWikiInputRef.value?.focus())
}
async function saveSystemWiki() {
  await setSystemWiki(selectedSystem.value.slug, systemWikiDraft.value)
  systemWikiEditing.value = false
}

// ── System body name editing ──────────────────────────────────────────────────

const systemBodyNameEditing = ref(null)
const systemBodyNameDraft = ref('')
watch(selectedSystemSlug, () => {
  systemBodyNameEditing.value = null
  selectedBodyMemberIndex.value = null
})
function startSystemBodyNameEdit(index, currentName) {
  systemBodyNameDraft.value = currentName
  systemBodyNameEditing.value = index
}
async function saveSystemBodyName(index) {
  await setSystemBodyName(selectedSystem.value.slug, index, systemBodyNameDraft.value)
  systemBodyNameEditing.value = null
}

// ── Body member editing (orbit, size, color) ──────────────────────────────────

const bodyOrbitEditing = ref(false)
const bodyOrbitDraft = ref('')
const bodySizeEditing = ref(false)
const bodySizeDraft = ref('')
const bodyColorEditing = ref(false)
const bodyColorDraft = ref('')
watch(selectedBodyMemberIndex, () => {
  bodyOrbitEditing.value = false
  bodySizeEditing.value = false
  bodyColorEditing.value = false
})
function startBodyOrbitEdit() {
  bodyOrbitDraft.value = String(selectedBodyMember.value?.orbit_distance ?? '')
  bodyOrbitEditing.value = true
}
async function saveBodyOrbit() {
  const val = parseInt(bodyOrbitDraft.value, 10)
  await setSystemBodyOrbitDistance(selectedSystem.value.slug, selectedBodyMemberIndex.value, isNaN(val) || val <= 0 ? null : val)
  bodyOrbitEditing.value = false
}
function startBodySizeEdit() {
  const isStar = selectedBodyMember.value?.type === 'star'
  bodySizeDraft.value = String(selectedBodyMember.value?.size ?? (isStar ? 0.5 : 60))
  bodySizeEditing.value = true
}
async function saveBodySize() {
  const isStar = selectedBodyMember.value?.type === 'star'
  const val = isStar ? parseFloat(bodySizeDraft.value) : parseInt(bodySizeDraft.value, 10)
  if (!isNaN(val) && val > 0) await setSystemBodySize(selectedSystem.value.slug, selectedBodyMemberIndex.value, val)
  bodySizeEditing.value = false
}
function startBodyColorEdit() {
  bodyColorDraft.value = (selectedBodyMember.value?.color ?? '#bb88ff').replace('#', '')
  bodyColorEditing.value = true
}
async function saveBodyColor() {
  const hex = '#' + bodyColorDraft.value
  if (/^#[0-9a-f]{6}$/i.test(hex)) await setSystemBodyColor(selectedSystem.value.slug, selectedBodyMemberIndex.value, hex)
  bodyColorEditing.value = false
}

// ── Orbit change handlers ─────────────────────────────────────────────────────

async function onBodyOrbitChange(memberIndex, event) {
  const val = parseInt(event.target.value, 10)
  await setSystemBodyOrbitDistance(selectedSystem.value.slug, memberIndex, isNaN(val) || val <= 0 ? null : val)
}

async function onPlanetOrbitChange(slug, event) {
  const val = parseInt(event.target.value, 10)
  await setOrbitDistance(slug, isNaN(val) || val <= 0 ? null : val)
}

async function onLagrangeChange(memberIndex, event) {
  const val = event.target.value
  const lp = val ? parseInt(val, 10) : null
  await setMemberLagrangePoint(selectedSystem.value.slug, memberIndex, lp)
}

// ── System member management ──────────────────────────────────────────────────

const newPlanetName = ref('')
const newBodyType = ref('asteroid_belt')
const newStarBodyName = ref('')
watch(selectedSystemSlug, () => { newStarBodyName.value = '' })

async function moveSystemMember(i, dir) {
  const members = [...(selectedSystem.value.members ?? [])]
  const j = i + dir
  ;[members[i], members[j]] = [members[j], members[i]]
  await updateSystemMembers(selectedSystem.value.slug, members)
}

async function removeSystemMember(i) {
  const members = (selectedSystem.value.members ?? []).filter((_, idx) => idx !== i)
  await updateSystemMembers(selectedSystem.value.slug, members)
}

async function addSystemPlanet() {
  const name = newPlanetName.value.trim()
  if (!name) return
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  await createPlanet(slug, name)
  const members = [...(selectedSystem.value.members ?? []), { type: 'planet', slug }]
  await updateSystemMembers(selectedSystem.value.slug, members)
  newPlanetName.value = ''
}

async function addSystemBody() {
  const entry = { type: newBodyType.value }
  if (newBodyType.value === 'star' && newStarBodyName.value.trim()) {
    entry.name = newStarBodyName.value.trim()
  }
  const members = [...(selectedSystem.value.members ?? []), entry]
  await updateSystemMembers(selectedSystem.value.slug, members)
  newStarBodyName.value = ''
}

// ── Planet name editing ───────────────────────────────────────────────────────

const planetNameEditing = ref(false)
const planetNameDraft = ref('')
const planetNameInputRef = ref(null)
watch(selectedPlanetSlug, () => { planetNameEditing.value = false })
function startPlanetNameEdit() {
  planetNameDraft.value = selectedPlanet.value?.name ?? ''
  planetNameEditing.value = true
  nextTick(() => planetNameInputRef.value?.focus())
}
async function savePlanetName() {
  const name = planetNameDraft.value.trim()
  if (name) await setPlanetName(selectedPlanet.value.slug, name)
  planetNameEditing.value = false
}

// ── Planet size editing ───────────────────────────────────────────────────────

const sizeEditing = ref(false)
const sizeDraft = ref('')
watch(selectedPlanetSlug, () => { sizeEditing.value = false })
function startSizeEdit() {
  sizeDraft.value = String(selectedPlanet.value?.size_multiplier ?? 1)
  sizeEditing.value = true
}
async function saveSize() {
  const val = parseFloat(sizeDraft.value)
  if (!isNaN(val) && val > 0) await setSizeMultiplier(selectedPlanet.value.slug, val)
  sizeEditing.value = false
}

// ── Planet orbit distance editing ─────────────────────────────────────────────

const orbitDistanceEditing = ref(false)
const orbitDistanceDraft = ref('')
watch(selectedPlanetSlug, () => { orbitDistanceEditing.value = false })
function startOrbitDistanceEdit() {
  const v = selectedPlanet.value?.orbit_distance
  orbitDistanceDraft.value = v != null ? String(v) : ''
  orbitDistanceEditing.value = true
}
async function saveOrbitDistance() {
  const val = parseInt(orbitDistanceDraft.value, 10)
  await setOrbitDistance(selectedPlanet.value.slug, isNaN(val) || val <= 0 ? null : val)
  orbitDistanceEditing.value = false
}

// ── Planet type ───────────────────────────────────────────────────────────────

async function setPlanetType(type) {
  const slug = selectedPlanet.value.slug
  await setGasGiant(slug, type === 'gas_giant')
  await setDwarfPlanet(slug, type === 'dwarf_planet')
  if (type !== 'normal') await setUninhabited(slug, true)
  if (type === 'dwarf_planet') await setSizeMultiplier(slug, 0.4)
}

// ── Planet color editing ──────────────────────────────────────────────────────

const colorEditing = ref(false)
const colorDraft = ref('')
const hexInputRef = ref(null)
watch(selectedPlanetSlug, () => { colorEditing.value = false })
function startColorEdit() {
  colorDraft.value = (selectedPlanet.value?.color ?? '').replace('#', '')
  colorEditing.value = true
  nextTick(() => hexInputRef.value?.focus())
}
function saveColor() {
  const hex = '#' + colorDraft.value
  if (/^#[0-9a-f]{6}$/i.test(hex)) setColor(selectedPlanet.value.slug, hex)
  colorEditing.value = false
}

// ── Planet wiki editing ───────────────────────────────────────────────────────

const wikiEditing = ref(false)
const wikiDraft = ref('')
const wikiInputRef = ref(null)
watch(selectedPlanetSlug, () => { wikiEditing.value = false })
function startWikiEdit() {
  wikiDraft.value = selectedPlanet.value?.wiki ?? ''
  wikiEditing.value = true
  nextTick(() => wikiInputRef.value?.focus())
}
function saveWiki() {
  setWiki(selectedPlanet.value.slug, wikiDraft.value)
  wikiEditing.value = false
}

// ── Moon management ───────────────────────────────────────────────────────────

const newMoonName = ref('')
watch(selectedPlanetSlug, () => { newMoonName.value = '' })

function addPanelMoon() {
  const name = newMoonName.value.trim()
  if (!name) return
  updateMoons(selectedPlanet.value.slug, [...(selectedPlanet.value.moons ?? []), name])
  newMoonName.value = ''
}

const moonRenaming = ref(null)
const moonRenameDraft = ref('')
watch(selectedPlanetSlug, () => { moonRenaming.value = null })
function startMoonRename(moonName, index) {
  moonRenameDraft.value = moonName
  moonRenaming.value = index
}
async function saveMoonRename(oldName, index) {
  const newName = moonRenameDraft.value.trim()
  if (newName && newName !== oldName) await renameMoon(selectedPlanet.value.slug, oldName, newName)
  moonRenaming.value = null
}

async function onMoonOrbitChange(moonName, event) {
  const val = parseInt(event.target.value, 10)
  const distances = { ...(selectedPlanet.value.moon_orbit_distances ?? {}) }
  if (isNaN(val) || val <= 0) {
    delete distances[moonName]
  } else {
    distances[moonName] = val
  }
  await setMoonOrbitDistances(selectedPlanet.value.slug, distances)
}

function onMoonOrbitTypeChange(moonName, event) {
  setMoonOrbitType(selectedPlanet.value.slug, moonName, event.target.value)
}

async function onSatelliteThicknessChange(moonName, event) {
  const val = parseInt(event.target.value, 10)
  const thicknesses = { ...(selectedPlanet.value.satellite_thicknesses ?? {}) }
  if (isNaN(val) || val <= 0) {
    delete thicknesses[moonName]
  } else {
    thicknesses[moonName] = val
  }
  await setSatelliteThickness(selectedPlanet.value.slug, thicknesses)
}

async function onSatelliteTiltChange(moonName, event) {
  const val = parseInt(event.target.value, 10)
  const tilts = { ...(selectedPlanet.value.satellite_tilts ?? {}) }
  if (isNaN(val)) {
    delete tilts[moonName]
  } else {
    tilts[moonName] = val
  }
  await setSatelliteTilt(selectedPlanet.value.slug, tilts)
}

// ── Orbit events ───────────────────────────────────────────────────────────
// Orbit events are no longer tied to a book directly — a Timeline Event
// (instance or range) references one or more of a planet's orbit events via
// its own orbit_event_ids field, set from the Timeline Event form.

const orbitEventsEditing = ref(false)
const newEventHasOrbit = ref(false)
const newEventHasColor = ref(false)
const newEventOrbitBefore = ref('')
const newEventOrbitAfter = ref('')
const newEventColorBefore = ref('')
const newEventColorAfter = ref('')
const previewingId = ref(null)
const creatingEventFor = ref(null)
const newLinkedEventDraft = reactive({ type: 'instance', title: '', yearStart: '', yearEnd: '' })

function resetOrbitEventDraft() {
  newEventHasOrbit.value = false
  newEventHasColor.value = false
  newEventOrbitBefore.value = ''
  newEventOrbitAfter.value = ''
  // Default "before" to the planet's current color — usually that's exactly
  // what you mean, and only the "after" needs to be typed.
  newEventColorBefore.value = (selectedPlanet.value?.color ?? '#888888').replace('#', '')
  newEventColorAfter.value = ''
}

watch(selectedPlanetSlug, () => {
  orbitEventsEditing.value = false
  resetOrbitEventDraft()
  previewingId.value = null
  orbitEventPreview.value = null
  creatingEventFor.value = null
})

watch(orbitEventsEditing, editing => {
  if (editing) resetOrbitEventDraft()
  else {
    previewingId.value = null
    orbitEventPreview.value = null
    creatingEventFor.value = null
  }
})

function triggerLabel(id) {
  const linked = timelineEvents.value.filter(e => (e.orbit_event_ids ?? []).includes(id))
  return linked.length ? linked.map(e => e.title).join(', ') : 'Unlinked'
}

// ── Trigger linking (create/assign a Timeline Event without leaving the map) ──
// Only offers events that already belong to this planet or aren't linked to
// any planet yet, matching the Settings form's "one planet per event" scoping.
const eligibleTimelineEvents = computed(() =>
  orderedEvents.value.filter(e => !e.planet_slug || e.planet_slug === selectedPlanet.value?.slug)
)

function triggerSelectValue(id) {
  return timelineEvents.value.find(e => (e.orbit_event_ids ?? []).includes(id))?.slug ?? ''
}

async function onTriggerChange(id, event) {
  const value = event.target.value
  if (value === '__new__') {
    creatingEventFor.value = id
    Object.assign(newLinkedEventDraft, { type: 'instance', title: '', yearStart: '', yearEnd: '' })
    return
  }
  const currentlyLinked = timelineEvents.value.filter(e => (e.orbit_event_ids ?? []).includes(id))
  await Promise.all(currentlyLinked.map(e =>
    updateTimelineEvent(e.slug, { orbit_event_ids: e.orbit_event_ids.filter(oid => oid !== id) })
  ))
  if (!value) return
  const target = timelineEvents.value.find(e => e.slug === value)
  if (!target) return
  await updateTimelineEvent(value, {
    orbit_event_ids: [...(target.orbit_event_ids ?? []), id],
    planet_slug: selectedPlanet.value.slug,
  })
}

async function createLinkedEvent(id) {
  if (newLinkedEventDraft.yearStart === '') return
  await addTimelineEvent({
    title: newLinkedEventDraft.title.trim(),
    description: '',
    event_type: newLinkedEventDraft.type,
    year_start: Number(newLinkedEventDraft.yearStart),
    year_end: newLinkedEventDraft.type === 'range' ? Number(newLinkedEventDraft.yearEnd) : null,
    book_slug: null,
    planet_slug: selectedPlanet.value.slug,
    system_slug: null,
    orbit_event_ids: [id],
  })
  creatingEventFor.value = null
}

function isPreviewing(id, after) {
  return previewingId.value === id && orbitEventPreview.value?.showAfter === after
}

function setPreview(id, showAfter) {
  const ev = (selectedPlanet.value.orbit_events ?? []).find(e => e.id === id)
  if (!ev) return
  previewingId.value = id
  orbitEventPreview.value = {
    planetSlug: selectedPlanet.value.slug,
    orbit: ev.orbit_after != null ? { before: ev.orbit_before, after: ev.orbit_after } : null,
    color: ev.color_after != null ? { before: ev.color_before, after: ev.color_after } : null,
    showAfter,
  }
}

async function deleteOrbitEvent(id) {
  const events = (selectedPlanet.value.orbit_events ?? []).filter(e => e.id !== id)
  await setTimelineEvents(selectedPlanet.value.slug, events)
  if (previewingId.value === id) {
    previewingId.value = null
    orbitEventPreview.value = null
  }
  if (creatingEventFor.value === id) creatingEventFor.value = null
  // Clean up dangling references on any Timeline Events that pointed at this deleted orbit event
  const referencing = timelineEvents.value.filter(e => (e.orbit_event_ids ?? []).includes(id))
  await Promise.all(referencing.map(e =>
    updateTimelineEvent(e.slug, { orbit_event_ids: e.orbit_event_ids.filter(oid => oid !== id) })
  ))
}

async function addOrbitEvent() {
  const entry = { id: crypto.randomUUID() }
  let hasChange = false

  if (newEventHasOrbit.value) {
    const after = parseInt(newEventOrbitAfter.value, 10)
    if (isNaN(after) || after <= 0) return
    const beforeVal = parseInt(newEventOrbitBefore.value, 10)
    entry.orbit_before = isNaN(beforeVal) || beforeVal <= 0 ? null : beforeVal
    entry.orbit_after = after
    hasChange = true
  }

  if (newEventHasColor.value) {
    const after = '#' + newEventColorAfter.value
    const before = '#' + newEventColorBefore.value
    if (!/^#[0-9a-f]{6}$/i.test(after) || !/^#[0-9a-f]{6}$/i.test(before)) return
    entry.color_before = before
    entry.color_after = after
    hasChange = true
  }

  if (!hasChange) return
  const events = [...(selectedPlanet.value.orbit_events ?? []), entry]
  await setTimelineEvents(selectedPlanet.value.slug, events)
  resetOrbitEventDraft()
}

// ── Keyboard navigation ───────────────────────────────────────────────────────

function onKeyDown(e) {
  if (e.key !== 'Escape') return
  if (selectedBodyMemberIndex.value !== null) {
    selectedBodyMemberIndex.value = null
    return
  }
  if (selectedPlanetSlug.value) {
    const planetSlug = selectedPlanetSlug.value
    const system = systems.value.find(s =>
      (s.members ?? []).some(m => {
        const slug = typeof m === 'string' ? m : m.slug
        const type = typeof m === 'string' ? 'planet' : m.type
        return type === 'planet' && slug === planetSlug
      })
    )
    selectedPlanetSlug.value = null
    if (system) {
      selectedSystemSlug.value = system.slug
      zoomTarget.value = { type: 'system', slug: system.slug }
    }
  } else {
    selectedSystemSlug.value = null
  }
}

onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))
</script>

<style scoped>
.panel-enter-active, .panel-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.panel-enter-from, .panel-leave-to { transform: translateX(100%); opacity: 0; }
</style>
