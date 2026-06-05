<template>
  <div class="relative h-full">
    <VueFlow
      :nodes-connectable="false"
      :edges-updatable="false"
      :min-zoom="0.01"
      :max-zoom="10"
      class="cosmere-map"
    >
      <MapSync :nodes="visibleNodes" :edges="visibleEdges" :edit-positions="editPositions" />
      <Background
        variant="dots"
        :gap="40"
        :size="1.2"
        pattern-color="#1e3a6e"
        bg-color="#000000"
      />
      <template #node-planet="nodeProps">
        <PlanetNode v-bind="nodeProps" />
      </template>
      <template #node-system="nodeProps">
        <SystemNode v-bind="nodeProps" />
      </template>
      <template #node-moon="nodeProps">
        <MoonNode v-bind="nodeProps" />
      </template>
      <template #node-secondary-star="nodeProps">
        <SecondaryStarNode v-bind="nodeProps" />
      </template>
      <template #node-anomaly="nodeProps">
        <AnomalyNode v-bind="nodeProps" />
      </template>

      <div v-if="visibleNodes.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p class="text-indigo-700 text-sm">Check a book in the sidebar to reveal its world.</p>
      </div>
    </VueFlow>

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
                    <input v-model="bodySizeDraft" type="number" step="10" min="10"
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

          <!-- Orbit Events section -->
          <div class="px-5 py-4 border-b border-surface-700">
            <div class="flex items-center justify-between mb-3">
              <p class="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">Orbit Events</p>
              <button class="text-xs text-indigo-500 hover:text-indigo-300 transition-colors" @click="orbitEventsEditing = !orbitEventsEditing">
                {{ orbitEventsEditing ? 'Done' : 'Edit' }}
              </button>
            </div>
            <div class="space-y-1 mb-2">
              <div v-for="(ev, i) in (selectedPlanet.orbit_events ?? [])" :key="i" class="flex items-center gap-2">
                <span class="flex-1 text-xs font-mono text-indigo-200 truncate">{{ ev.trigger_book }}</span>
                <span class="text-xs font-mono text-indigo-400 shrink-0">→ {{ ev.orbit_distance }}px</span>
                <button v-if="orbitEventsEditing" class="text-red-400 hover:text-red-300 text-lg leading-none transition-colors shrink-0" @click="deleteOrbitEvent(i)">×</button>
              </div>
              <p v-if="!(selectedPlanet.orbit_events ?? []).length" class="text-sm text-indigo-600 italic">None</p>
            </div>
            <div v-if="orbitEventsEditing" class="space-y-2 mt-2">
              <select v-model="newOrbitEventBook"
                class="w-full bg-surface-700 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-blue-100 focus:outline-none focus:border-accent-500 transition-colors">
                <option value="" disabled>Select trigger book…</option>
                <option v-for="book in books" :key="book.slug" :value="book.slug">{{ book.title }}</option>
              </select>
              <div class="flex gap-2 items-center">
                <span class="text-xs text-indigo-400 shrink-0">Distance</span>
                <input v-model="newOrbitEventDistance" type="number" step="10" min="0" placeholder="px"
                  class="w-20 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors" />
                <button class="flex-1 px-3 py-1 bg-accent-600 hover:bg-accent-500 text-white text-xs rounded-lg transition-colors" @click="addOrbitEvent">Add</button>
              </div>
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
  </div>
</template>

<script setup>
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { averageHexColors } from '~/utils/colorUtils'
import { resolveOrbitDistance } from '~/utils/orbitUtils'

definePageMeta({ layout: 'map' })

const { books, load } = useCosmere()
const { readSlugs, init: initRead } = useReadBooks()
const { planets, init: initPlanets, nodeData, setColor, setWiki, setSizeMultiplier, setRingCount, setUninhabited, setGasGiant, setDwarfPlanet, setOrbitDistance, setOrbitEvents, setPolarOrbitMoons, setMoonOrbitDistances, setMoonOrbitType, setSatelliteType, setSatelliteThickness, setSatelliteTilt, createPlanet, updateMoons, batchUpdatePositions, computeOrbitRadii, setPlanetName, renameMoon } = usePlanetSettings()
const { systems, init: initSystems, batchUpdateSystemPositions, updateSystemMembers, setSystemName, setSystemBodyName, setSystemBodyParticulateRing, setSystemBodySize, setSystemBodyColor, setSystemBodyOrbitDistance, setSystemWiki, setStarName, setStarColor, setStarSize, setStarParticulateRing, setMemberLagrangePoint } = useSystemSettings()
const { editPositions, selectedPlanetSlug, selectedSystemSlug, selectedBodyMemberIndex, zoomTarget, hiddenPlanetSlugs, initHiddenPlanets } = useMapState()
initHiddenPlanets()

const selectedSystem = computed(() =>
  systems.value.find(s => s.slug === selectedSystemSlug.value) ?? null
)

const selectedSystemPlanets = computed(() =>
  (selectedSystem.value?.members ?? [])
    .filter(m => m.type === 'planet')
    .map(m => planets.value.find(p => p.slug === m.slug))
    .filter(Boolean)
)

const selectedBodyMember = computed(() =>
  selectedBodyMemberIndex.value !== null
    ? (selectedSystem.value?.members ?? [])[selectedBodyMemberIndex.value] ?? null
    : null
)
watch(selectedSystemSlug, () => { selectedBodyMemberIndex.value = null })

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
  bodySizeDraft.value = String(selectedBodyMember.value?.size ?? 60)
  bodySizeEditing.value = true
}
async function saveBodySize() {
  const val = parseInt(bodySizeDraft.value, 10)
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

// System panel editing
const bodyTypeOptions = [
  { value: 'asteroid_belt', label: 'Asteroid Belt' },
  { value: 'comet_belt', label: 'Comet Belt' },
  { value: 'star', label: 'Star' },
  { value: 'anomaly', label: 'Anomaly' },
]
const newPlanetName = ref('')
const newBodyType = ref('asteroid_belt')
const newStarBodyName = ref('')
watch(selectedSystemSlug, () => { newStarBodyName.value = '' })

// System name editing
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

// System body name editing (for non-planet members like asteroid belts)
const systemBodyNameEditing = ref(null)
const systemBodyNameDraft = ref('')
watch(selectedSystemSlug, () => { systemBodyNameEditing.value = null })
function startSystemBodyNameEdit(index, currentName) {
  systemBodyNameDraft.value = currentName
  systemBodyNameEditing.value = index
}
async function saveSystemBodyName(index) {
  await setSystemBodyName(selectedSystem.value.slug, index, systemBodyNameDraft.value)
  systemBodyNameEditing.value = null
}

async function onBodyOrbitChange(memberIndex, event) {
  const val = parseInt(event.target.value, 10)
  await setSystemBodyOrbitDistance(selectedSystem.value.slug, memberIndex, isNaN(val) || val <= 0 ? null : val)
}

async function onPlanetOrbitChange(slug, event) {
  const val = parseInt(event.target.value, 10)
  await setOrbitDistance(slug, isNaN(val) || val <= 0 ? null : val)
}

const starNameEditing = ref(false)
const starNameDraft = ref('')
const starColorEditing = ref(false)
const starColorDraft = ref('')
const starSizeEditing = ref(false)
const starSizeDraft = ref('')
watch(selectedSystemSlug, () => { starSizeEditing.value = false })
function startStarSizeEdit() {
  starSizeDraft.value = String(selectedSystem.value?.star_size ?? 1)
  starSizeEditing.value = true
}
async function saveStarSize() {
  const val = parseFloat(starSizeDraft.value)
  if (!isNaN(val) && val > 0) await setStarSize(selectedSystem.value.slug, val)
  starSizeEditing.value = false
}
const systemWikiEditing = ref(false)
const systemWikiDraft = ref('')
const systemWikiInputRef = ref(null)
watch(selectedSystemSlug, () => { starNameEditing.value = false; starColorEditing.value = false; systemWikiEditing.value = false })

function startSystemWikiEdit() {
  systemWikiDraft.value = selectedSystem.value?.wiki ?? ''
  systemWikiEditing.value = true
  nextTick(() => systemWikiInputRef.value?.focus())
}
async function saveSystemWiki() {
  await setSystemWiki(selectedSystem.value.slug, systemWikiDraft.value)
  systemWikiEditing.value = false
}

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


async function onLagrangeChange(memberIndex, event) {
  const val = event.target.value
  const lp = val ? parseInt(val, 10) : null
  await setMemberLagrangePoint(selectedSystem.value.slug, memberIndex, lp)
}

function bodyLabel(type) {
  return bodyTypeOptions.find(o => o.value === type)?.label ?? type
}

function planetBySlug(slug) {
  return planets.value.find(p => p.slug === slug)
}

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

// Planet size editing
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

// Planet orbit distance (px from star centre; null = auto)
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

// Planet type (Gas Giant / Dwarf Planet — mutually exclusive, both imply uninhabited)
const planetTypeOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'gas_giant', label: 'Gas Giant' },
  { value: 'dwarf_planet', label: 'Dwarf Planet' },
]
const planetType = computed(() => {
  if (selectedPlanet.value?.is_gas_giant) return 'gas_giant'
  if (selectedPlanet.value?.is_dwarf_planet) return 'dwarf_planet'
  return 'normal'
})
async function setPlanetType(type) {
  const slug = selectedPlanet.value.slug
  await setGasGiant(slug, type === 'gas_giant')
  await setDwarfPlanet(slug, type === 'dwarf_planet')
  if (type !== 'normal') await setUninhabited(slug, true)
  if (type === 'dwarf_planet') await setSizeMultiplier(slug, 0.4)
}


const selectedPlanet = computed(() =>
  planets.value.find(p => p.slug === selectedPlanetSlug.value) ?? null
)

// Planet name editing
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

// Moon renaming
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

const colorEditing = ref(false)
const colorDraft = ref('')
const hexInputRef = ref(null)

const wikiEditing = ref(false)
const wikiDraft = ref('')
const wikiInputRef = ref(null)

watch(selectedPlanetSlug, () => { colorEditing.value = false; wikiEditing.value = false })

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

function startWikiEdit() {
  wikiDraft.value = selectedPlanet.value?.wiki ?? ''
  wikiEditing.value = true
  nextTick(() => wikiInputRef.value?.focus())
}

function saveWiki() {
  setWiki(selectedPlanet.value.slug, wikiDraft.value)
  wikiEditing.value = false
}

const newMoonName = ref('')
watch(selectedPlanetSlug, () => { newMoonName.value = '' })

function addPanelMoon() {
  const name = newMoonName.value.trim()
  if (!name) return
  updateMoons(selectedPlanet.value.slug, [...(selectedPlanet.value.moons ?? []), name])
  newMoonName.value = ''
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

function toggleMoonPolarOrbit(moonName) {
  const current = selectedPlanet.value.polar_orbit_moons ?? []
  const next = current.includes(moonName)
    ? current.filter(m => m !== moonName)
    : [...current, moonName]
  setPolarOrbitMoons(selectedPlanet.value.slug, next)
}

function getSatelliteType(planet, moonName) {
  return (planet.satellite_types ?? {})[moonName] ?? 'moon'
}

function getMoonOrbitType(planet, moonName) {
  const types = planet.moon_orbit_types ?? {}
  if (types[moonName]) return types[moonName]
  if ((planet.polar_orbit_moons ?? []).includes(moonName)) return 'polar'
  return 'standard'
}

function onMoonOrbitTypeChange(moonName, event) {
  setMoonOrbitType(selectedPlanet.value.slug, moonName, event.target.value)
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

// Orbit events editing
const orbitEventsEditing = ref(false)
const newOrbitEventBook = ref('')
const newOrbitEventDistance = ref('')
watch(selectedPlanetSlug, () => {
  orbitEventsEditing.value = false
  newOrbitEventBook.value = ''
  newOrbitEventDistance.value = ''
})
async function deleteOrbitEvent(index) {
  const events = (selectedPlanet.value.orbit_events ?? []).filter((_, i) => i !== index)
  await setOrbitEvents(selectedPlanet.value.slug, events)
}
async function addOrbitEvent() {
  const bookSlug = newOrbitEventBook.value
  if (!bookSlug) return
  const distance = parseInt(newOrbitEventDistance.value, 10)
  if (isNaN(distance) || distance <= 0) return
  const events = [...(selectedPlanet.value.orbit_events ?? []), { trigger_book: bookSlug, orbit_distance: distance }]
  await setOrbitEvents(selectedPlanet.value.slug, events)
  newOrbitEventBook.value = ''
  newOrbitEventDistance.value = ''
}

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

await load()
await initRead()
await initPlanets()
await initSystems()

const visibleWorldIds = computed(() => {
  const ids = new Set()
  for (const book of books.value) {
    if (readSlugs.value.includes(book.slug) && book.planets) {
      book.planets.forEach(p => ids.add(p))
    }
  }
  return ids
})

const visiblePlanetSlugs = computed(() => {
  const hidden = new Set(hiddenPlanetSlugs.value)
  return new Set([...visibleWorldIds.value].filter(s => !hidden.has(s)))
})

const visibleEdges = ref([])

function planetSize(p) {
  return Math.floor(Math.max(0.1, p.size_multiplier ?? 1) * 64)
}

// Vue Flow requires parent nodes to appear before their children
const visibleNodes = computed(() => {
  const systemNodes = []
  const planetNodes = []

  for (const system of systems.value) {
    const planetSlugs = (system.members ?? system.planets ?? []).filter(m => typeof m === 'string' ? true : m.type === 'planet').map(m => typeof m === 'string' ? m : m.slug)
    const allMembers = planetSlugs.map(slug => planets.value.find(p => p.slug === slug)).filter(Boolean)
    const hasVisible = system.always_visible || allMembers.some(p => visiblePlanetSlugs.value.has(p.slug))
    if (!hasVisible) continue

    const inhabitedMembers = allMembers.filter(p => p.uninhabited !== true)
    const color = averageHexColors((inhabitedMembers.length ? inhabitedMembers : allMembers).map(p => p.color))

    const systemMemberList = system.members ?? system.planets ?? []

    // innerR based purely on star visual size — no dependency on system size
    const starVisualR = Math.floor(Math.max(0.1, system.star_size ?? 1) * 64) / 2
    const innerR = Math.round(starVisualR) + 20

    // autoOuterR: default orbit range for auto-spaced members
    const autoOuterR = innerR + Math.max(80, systemMemberList.length * 55)

    // Collect max manual orbit distance across all members
    let maxManualDist = 0
    systemMemberList.forEach(member => {
      const mType = typeof member === 'string' ? 'planet' : member.type
      if (mType !== 'planet') {
        if (typeof member === 'object' && member.orbit_distance != null)
          maxManualDist = Math.max(maxManualDist, member.orbit_distance)
      } else {
        const mSlug = typeof member === 'string' ? member : member.slug
        const planet = planets.value.find(p => p.slug === mSlug)
        if (planet?.orbit_distance != null)
          maxManualDist = Math.max(maxManualDist, planet.orbit_distance)
      }
    })

    const outerR = Math.max(autoOuterR, maxManualDist > 0 ? maxManualDist + 50 : 0)
    const size = Math.ceil(outerR + 40) * 2

    const n = systemMemberList.length || allMembers.length
    const sysCX = system.map_x + size / 2
    const sysCY = system.map_y + size / 2
    const angle = -Math.PI / 2  // 12 o'clock

    // Binary star support — derived from star-type members
    const starMemberIdx = systemMemberList.findIndex(m => typeof m === 'object' && m.type === 'star')
    const isBinary = starMemberIdx !== -1
    // secondaryOrbitR resolved after memberOrbitDistances is computed (see below)
    let secondaryOrbitR = 0
    function getLagrangePos(lp) {
      switch (lp) {
        case 1: return { r: secondaryOrbitR * 0.78, a: angle }
        case 2: return { r: secondaryOrbitR * 1.18, a: angle }
        case 3: return { r: secondaryOrbitR, a: angle + Math.PI }
        case 4: return { r: secondaryOrbitR, a: angle - Math.PI / 3 }
        case 5: return { r: secondaryOrbitR, a: angle + Math.PI / 3 }
        default: return { r: secondaryOrbitR, a: angle }
      }
    }
    const memberLagrangePoints = systemMemberList.map(m =>
      typeof m === 'object' ? (m.lagrange_point ?? null) : null
    )

    // Exclude Lagrange members from orbit spacing; reconstruct full radius array
    const nonLagrangeMembers = isBinary
      ? systemMemberList.filter((_, i) => !memberLagrangePoints[i])
      : systemMemberList
    const nonLagrangeRadii = computeOrbitRadii(nonLagrangeMembers, innerR, autoOuterR)
    let nlIdx = 0
    const autoOrbitRadii = systemMemberList.map((m, i) => {
      if (isBinary && memberLagrangePoints[i]) return getLagrangePos(memberLagrangePoints[i]).r
      const r = nonLagrangeRadii[nlIdx] ?? innerR + (autoOuterR - innerR) / 2
      nlIdx++
      return r
    })

    // Resolve final orbit distance for each member (manual overrides auto)
    const memberOrbitDistances = autoOrbitRadii.map((defaultR, i) => {
      const member = systemMemberList[i]
      const mType = typeof member === 'string' ? 'planet' : member.type
      const mSlug = typeof member === 'string' ? member : member.slug
      if (mType !== 'planet' || memberLagrangePoints[i]) {
        if (typeof member === 'object' && member.orbit_distance != null) return member.orbit_distance
        return defaultR
      }
      const planet = planets.value.find(p => p.slug === mSlug)
      const baseline = planet?.orbit_distance ?? defaultR
      return resolveOrbitDistance(planet?.orbit_events ?? [], baseline, innerR, autoOuterR, readSlugs.value)
    })

    if (isBinary) secondaryOrbitR = memberOrbitDistances[starMemberIdx] ?? innerR + 0.65 * (autoOuterR - innerR)

    systemNodes.push({
      id: `system-${system.slug}`,
      type: 'system',
      position: { x: system.map_x, y: system.map_y },
      draggable: editPositions.value,
      style: { width: `${size}px`, height: `${size}px`, zIndex: -1 },
      data: {
        name: system.name,
        starName: system.star_name ?? null,
        starColor: system.star_color ?? '#ffcc44',
        starSize: system.star_size ?? 1,
        starParticulateRing: system.star_particulate_ring ?? false,
        isBinary,
        secondaryStarOrbitDist: isBinary ? memberOrbitDistances[starMemberIdx] ?? 0 : 0,
        secondaryStarColor: isBinary ? (systemMemberList[starMemberIdx]?.color ?? '#ff8844') : '#ff8844',
        color,
        size,
        slug: system.slug,
        planetCount: allMembers.length,
        memberTypes: systemMemberList.map(m => typeof m === 'string' ? 'planet' : m.type),
        memberOrbitDistances,
        memberLagrangePoints,
      },
    })

    // Secondary star nodes — one per star-type member
    systemMemberList.forEach((member, i) => {
      if (typeof member !== 'object' || member.type !== 'star') return
      const starColor = member.color ?? '#ff8844'
      const sizeMultiplier = member.size ?? 0.5
      const ssRadius = Math.max(3, Math.round(starVisualR * sizeMultiplier))
      const orbitR = memberOrbitDistances[i]
      planetNodes.push({
        id: `secondary-${system.slug}-${i}`,
        type: 'secondary-star',
        draggable: false,
        position: {
          x: sysCX + orbitR * Math.cos(angle) - ssRadius,
          y: sysCY + orbitR * Math.sin(angle) - ssRadius,
        },
        data: {
          color: starColor,
          size: ssRadius * 2,
          particulateRing: member.particulate_ring ?? false,
          systemSlug: system.slug,
          memberIndex: i,
        },
      })
    })

    // For each member, collect ALL possible orbit radii (default + every orbit_event
    // override). Lagrange members use only their fixed radius (no event overrides).
    const allPossibleOrbitR = systemMemberList.map((member, i) => {
      const type = typeof member === 'string' ? 'planet' : member.type
      const slug = typeof member === 'string' ? member : member.slug
      const defaultR = autoOrbitRadii[i]
      if (type !== 'planet') return [memberOrbitDistances[i]]
      if (memberLagrangePoints[i]) return [memberOrbitDistances[i]]
      const planet = planets.value.find(p => p.slug === slug)
      const baseR = planet?.orbit_distance ?? defaultR
      const eventRs = (planet?.orbit_events ?? []).map(ev =>
        ev.orbit_distance ?? baseR
      )
      return [baseR, ...eventRs]
    })

    // Build ordered planet-orbit list (Lagrange planets excluded from gap calc)
    const planetOrbitList = []
    const memberToPlanetIdx = new Map()
    systemMemberList.forEach((member, i) => {
      const type = typeof member === 'string' ? 'planet' : member.type
      if (type !== 'planet') return
      if (memberLagrangePoints[i]) return
      memberToPlanetIdx.set(i, planetOrbitList.length)
      planetOrbitList.push(allPossibleOrbitR[i])
    })

    systemMemberList.forEach((member, i) => {
      const memberType = typeof member === 'string' ? 'planet' : member.type
      const slug = typeof member === 'string' ? member : member.slug
      if (memberType === 'anomaly') {
        const orbitR = memberOrbitDistances[i]
        const anomalySize = member.size ?? 60
        planetNodes.push({
          id: `anomaly-${system.slug}-${i}`,
          type: 'anomaly',
          draggable: false,
          position: {
            x: sysCX + orbitR * Math.cos(angle) - anomalySize / 2,
            y: sysCY + orbitR * Math.sin(angle) - anomalySize / 2,
          },
          data: { size: anomalySize, color: member.color ?? '#bb88ff', systemSlug: system.slug, orbitDist: orbitR },
        })
        return
      }
      if (memberType !== 'planet') return
      const planet = planets.value.find(p => p.slug === slug)
      if (!planet) return
      if (hiddenPlanetSlugs.value.includes(slug)) return
      const pSize = planetSize(planet)
      const lagrangePoint = memberLagrangePoints[i]

      let orbitR, posAngle, maxMoonOrbitR

      if (isBinary && lagrangePoint) {
        // Lagrange planet: fixed position, not animated
        const lp = getLagrangePos(lagrangePoint)
        orbitR = lp.r
        posAngle = lp.a
        maxMoonOrbitR = Infinity
      } else {
        // Normal planet: standard orbit with gap-based moon spacing
        orbitR = memberOrbitDistances[i]
        posAngle = angle
        const pi = memberToPlanetIdx.get(i)
        const myRs = planetOrbitList[pi]
        const innerRs = pi > 0 ? planetOrbitList[pi - 1] : null
        const outerRs = pi < planetOrbitList.length - 1 ? planetOrbitList[pi + 1] : null
        const innerGap = innerRs ? Math.max(0, Math.min(...myRs) - Math.max(...innerRs)) : Infinity
        const outerGap = outerRs ? Math.max(0, Math.min(...outerRs) - Math.max(...myRs)) : Infinity
        const halfGap = planetOrbitList.length > 1 ? Math.min(innerGap, outerGap) / 2 : Infinity
        maxMoonOrbitR = halfGap > pSize / 2 ? halfGap : Infinity
      }

      // Compute per-moon orbit data once — used for both the ring display and animation
      const mBaseR = pSize / 2 + 40
      const mCount = (planet.moons ?? []).length
      const mNaturalMax = mBaseR + Math.max(0, mCount - 1) * 24
      const mSpacing = isFinite(maxMoonOrbitR) && mCount > 1 && maxMoonOrbitR < mNaturalMax
        ? (maxMoonOrbitR - mBaseR) / (mCount - 1)
        : 24
      const polarOrbitMoonsSet = new Set(planet.polar_orbit_moons ?? [])
      const moonOrbitDistMap = planet.moon_orbit_distances ?? {}
      const satTypeMap = planet.satellite_types ?? {}
      const satThickMap = planet.satellite_thicknesses ?? {}
      const satTiltMap = planet.satellite_tilts ?? {}
      const allSatOrbits = (planet.moons ?? []).map((moonName, mi) => {
        const mDist = moonOrbitDistMap[moonName]
        const isManual = mDist != null
        const orbitR = isManual
          ? Math.max(pSize / 2, mDist)
          : mBaseR + mi * mSpacing
        const orbitType = getMoonOrbitType(planet, moonName)
        const orbitRotation = (mi / Math.max(mCount, 1)) * Math.PI * 2
        const satType = satTypeMap[moonName] ?? 'moon'
        const thickness = satThickMap[moonName] ?? null
        const tilt = satTiltMap[moonName] ?? null
        return { orbitR, isPolarOrbit: orbitType === 'polar', isManual, orbitType, orbitRotation, satType, thickness, tilt }
      })

      const moonOrbits = allSatOrbits.filter(o => o.satType !== 'ring')
      const ringOrbits = allSatOrbits.filter(o => o.satType === 'ring').map(o => ({ orbitR: o.orbitR, thickness: o.thickness, tilt: o.tilt }))

      planetNodes.push({
        id: planet.slug,
        type: 'planet',
        draggable: false,
        position: {
          x: sysCX + orbitR * Math.cos(posAngle) - pSize / 2,
          y: sysCY + orbitR * Math.sin(posAngle) - pSize / 2,
        },
        data: { ...nodeData(planet), systemSlug: system.slug, memberIndex: i, memberCount: n, maxMoonOrbitR, moonOrbits, ringOrbits },
      })

      // Moon nodes — only for non-ring satellites
      const slugSeed = planet.slug.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 10000, 0) / 10000
      moonOrbits.forEach((moonData, mi) => {
        const phaseOffset = (slugSeed + mi * 0.6180339887) % 1
        planetNodes.push({
          id: `moon-${planet.slug}-${mi}`,
          type: 'moon',
          draggable: false,
          position: { x: 0, y: 0 },  // driven by animation loop
          data: { parentSlug: planet.slug, index: mi, count: mCount, planetSize: pSize, phaseOffset, isPolarOrbit: moonData.isPolarOrbit, orbitType: moonData.orbitType, orbitRotation: moonData.orbitRotation, manualOrbitR: moonData.isManual ? moonData.orbitR : null },
        })
      })
    })
  }

  return [...systemNodes, ...planetNodes]
})
</script>

<style>
.cosmere-map .vue-flow__edge-path { stroke-opacity: 0.6; }
.cosmere-map .vue-flow__handle { display: none; }
.cosmere-map .vue-flow__node { background: transparent; border: none; padding: 0; }
.cosmere-map .vue-flow__node.selected > div { outline: none; }
.cosmere-map .vue-flow__node { cursor: pointer; }
</style>

<style scoped>
.panel-enter-active, .panel-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.panel-enter-from, .panel-leave-to { transform: translateX(100%); opacity: 0; }
</style>
