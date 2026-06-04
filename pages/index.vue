<template>
  <div class="relative h-full">
    <VueFlow
      :nodes-connectable="false"
      :edges-updatable="false"
      :min-zoom="0.01"
      :max-zoom="4"
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

      <div v-if="visibleNodes.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p class="text-indigo-700 text-sm">Check a book in the sidebar to reveal its world.</p>
      </div>
    </VueFlow>

    <!-- System panel -->
    <Transition name="panel">
      <div
        v-if="selectedSystem && !selectedPlanet"
        class="absolute top-0 right-0 h-full w-1/5 bg-surface-900 border-l border-surface-700 z-10 flex flex-col"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <h2 class="text-base font-semibold text-blue-50 truncate">{{ selectedSystem.name }}</h2>
          <button class="text-indigo-400 hover:text-blue-100 transition-colors p-1 -mr-1 shrink-0" @click="selectedSystemSlug = null">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <!-- Size -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startSystemSizeEdit">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="startSystemSizeEdit">Size</span>
            </div>
            <div class="flex items-center gap-2">
              <template v-if="systemSizeEditing">
                <input v-model="systemSizeDraft" type="number" step="50" min="150"
                  class="w-28 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveSystemSize" @keydown.escape="systemSizeEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors" @click="saveSystemSize">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button class="text-red-400 hover:text-red-300 transition-colors" @click="systemSizeEditing = false">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </template>
              <span v-else class="text-xs font-mono text-indigo-400">{{ selectedSystem.size ?? 'Auto' }}px</span>
            </div>
          </div>

          <!-- Members -->
          <div>
            <p class="text-xs text-indigo-400 uppercase tracking-widest mb-2">Members</p>
            <div class="space-y-1">
              <div v-for="(member, mi) in (selectedSystem.members ?? [])" :key="mi" class="flex items-center gap-1.5">
                <template v-if="member.type === 'planet'">
                  <div v-if="!planetBySlug(member.slug)?.uninhabited" class="w-2 h-2 rounded-full shrink-0"
                    :style="{ background: planetBySlug(member.slug)?.color }" />
                  <button class="flex-1 text-sm text-left truncate transition-colors"
                    :class="planetBySlug(member.slug)?.uninhabited ? 'text-indigo-500 italic' : 'text-blue-100 hover:text-accent-400'"
                    @click="selectedPlanetSlug = member.slug; selectedSystemSlug = null; zoomTarget = { type: 'planet', slug: member.slug }">
                    {{ planetBySlug(member.slug)?.name ?? member.slug }}
                  </button>
                  <select v-if="selectedSystem.is_binary"
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
                <span v-else class="flex-1 text-sm text-indigo-400 italic">{{ member.name ? `${bodyLabel(member.type)}: ${member.name}` : bodyLabel(member.type) }}</span>
                <div class="flex gap-0.5 shrink-0">
                  <button class="text-indigo-500 hover:text-blue-100 disabled:opacity-30 px-0.5 text-xs transition-colors" :disabled="mi === 0" @click="moveSystemMember(mi, -1)">↑</button>
                  <button class="text-indigo-500 hover:text-blue-100 disabled:opacity-30 px-0.5 text-xs transition-colors" :disabled="mi === (selectedSystem.members ?? []).length - 1" @click="moveSystemMember(mi, 1)">↓</button>
                  <button class="text-red-400 hover:text-red-300 px-0.5 text-sm transition-colors" @click="removeSystemMember(mi)">×</button>
                </div>
              </div>
              <p v-if="!(selectedSystem.members ?? []).length" class="text-sm text-indigo-600 italic">None</p>
            </div>
          </div>

          <!-- Add planet / body -->
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

          <!-- Star name -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startStarNameEdit">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="startStarNameEdit">Star</span>
            </div>
            <template v-if="starNameEditing">
              <div class="flex items-center gap-2">
                <input ref="starNameInputRef" v-model="starNameDraft" type="text" placeholder="Star name…"
                  class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveStarName" @keydown.escape="starNameEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveStarName">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="starNameEditing = false">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </template>
            <span v-else class="text-sm" :class="selectedSystem.star_name ? 'text-blue-100' : 'text-indigo-600 italic'">
              {{ selectedSystem.star_name || 'Not set' }}
            </span>
          </div>

          <!-- Star color -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startStarColorEdit">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="startStarColorEdit">Star Color</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded-full shrink-0"
                :style="{ background: starColorEditing ? starColorDraft : (selectedSystem.star_color ?? '#ffcc44'), boxShadow: `0 0 6px 2px ${starColorEditing ? starColorDraft : (selectedSystem.star_color ?? '#ffcc44')}55` }" />
              <template v-if="starColorEditing">
                <input v-model="starColorDraft" type="text" maxlength="7" placeholder="#ffcc44"
                  class="w-28 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveStarColor" @keydown.escape="starColorEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors" @click="saveStarColor">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button class="text-red-400 hover:text-red-300 transition-colors" @click="starColorEditing = false">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </template>
              <span v-else class="text-xs font-mono text-indigo-400">{{ selectedSystem.star_color ?? '#ffcc44' }}</span>
            </div>
          </div>

          <!-- Supergiant -->
          <div class="flex items-center justify-between">
            <span class="text-xs text-indigo-400 uppercase tracking-widest">Supergiant</span>
            <button
              class="relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none"
              :class="selectedSystem.is_supergiant ? 'bg-accent-600' : 'bg-surface-600'"
              @click="setStarSupergiant(selectedSystem.slug, !selectedSystem.is_supergiant)"
            >
              <span class="inline-block w-3 h-3 bg-white rounded-full shadow transition-transform"
                :class="selectedSystem.is_supergiant ? 'translate-x-5' : 'translate-x-1'" />
            </button>
          </div>

          <!-- Binary System -->
          <div class="flex items-center justify-between">
            <span class="text-xs text-indigo-400 uppercase tracking-widest">Binary System</span>
            <button
              class="relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none"
              :class="selectedSystem.is_binary ? 'bg-accent-600' : 'bg-surface-600'"
              @click="setBinary(selectedSystem.slug, !selectedSystem.is_binary)"
            >
              <span class="inline-block w-3 h-3 bg-white rounded-full shadow transition-transform"
                :class="selectedSystem.is_binary ? 'translate-x-5' : 'translate-x-1'" />
            </button>
          </div>

          <!-- Secondary Star (visible when binary) -->
          <template v-if="selectedSystem.is_binary">
            <div>
              <p class="text-xs text-indigo-400 uppercase tracking-widest mb-3">Secondary Star</p>
              <div class="space-y-3">

                <!-- Secondary star name -->
                <div>
                  <div class="flex items-center gap-1.5 mb-1">
                    <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startSecStarNameEdit">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <span class="text-xs text-indigo-500 uppercase tracking-widest cursor-pointer" @click="startSecStarNameEdit">Name</span>
                  </div>
                  <template v-if="secStarNameEditing">
                    <div class="flex items-center gap-2">
                      <input v-model="secStarNameDraft" type="text" placeholder="Secondary star name…"
                        class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                        @keydown.enter="saveSecStarName" @keydown.escape="secStarNameEditing = false" />
                      <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveSecStarName">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="secStarNameEditing = false">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </template>
                  <span v-else class="text-sm" :class="selectedSystem.secondary_star_name ? 'text-blue-100' : 'text-indigo-600 italic'">
                    {{ selectedSystem.secondary_star_name || 'Not set' }}
                  </span>
                </div>

                <!-- Secondary star color -->
                <div>
                  <div class="flex items-center gap-1.5 mb-1">
                    <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startSecStarColorEdit">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <span class="text-xs text-indigo-500 uppercase tracking-widest cursor-pointer" @click="startSecStarColorEdit">Color</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded-full shrink-0"
                      :style="{ background: secStarColorEditing ? secStarColorDraft : (selectedSystem.secondary_star_color ?? '#ff8844'), boxShadow: `0 0 5px 1px ${secStarColorEditing ? secStarColorDraft : (selectedSystem.secondary_star_color ?? '#ff8844')}55` }" />
                    <template v-if="secStarColorEditing">
                      <input v-model="secStarColorDraft" type="text" maxlength="7" placeholder="#ff8844"
                        class="w-24 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                        @keydown.enter="saveSecStarColor" @keydown.escape="secStarColorEditing = false" />
                      <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveSecStarColor">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="secStarColorEditing = false">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </template>
                    <span v-else class="text-xs font-mono text-indigo-400">{{ selectedSystem.secondary_star_color ?? '#ff8844' }}</span>
                  </div>
                </div>

                <!-- Secondary star size -->
                <div>
                  <div class="flex items-center gap-1.5 mb-1">
                    <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startSecStarSizeEdit">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <span class="text-xs text-indigo-500 uppercase tracking-widest cursor-pointer" @click="startSecStarSizeEdit">Size</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <template v-if="secStarSizeEditing">
                      <input v-model="secStarSizeDraft" type="number" step="0.05" min="0.05" max="2"
                        class="w-20 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                        @keydown.enter="saveSecStarSize" @keydown.escape="secStarSizeEditing = false" />
                      <button class="text-green-400 hover:text-green-300 transition-colors" @click="saveSecStarSize">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button class="text-red-400 hover:text-red-300 transition-colors" @click="secStarSizeEditing = false">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </template>
                    <span v-else class="text-xs font-mono text-indigo-400">×{{ selectedSystem.secondary_star_size ?? 0.5 }}</span>
                  </div>
                </div>

                <!-- Secondary star orbit fraction -->
                <div>
                  <div class="flex items-center gap-1.5 mb-1">
                    <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startSecStarOrbitEdit">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <span class="text-xs text-indigo-500 uppercase tracking-widest cursor-pointer" @click="startSecStarOrbitEdit">Orbit</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <template v-if="secStarOrbitEditing">
                      <input v-model="secStarOrbitDraft" type="number" step="0.05" min="0.05" max="0.95"
                        class="w-20 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                        @keydown.enter="saveSecStarOrbit" @keydown.escape="secStarOrbitEditing = false" />
                      <button class="text-green-400 hover:text-green-300 transition-colors" @click="saveSecStarOrbit">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button class="text-red-400 hover:text-red-300 transition-colors" @click="secStarOrbitEditing = false">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </template>
                    <span v-else class="text-xs font-mono text-indigo-400">{{ selectedSystem.secondary_star_orbit_fraction ?? 0.65 }}</span>
                  </div>
                </div>

              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- Planet panel -->
    <Transition name="panel">
      <div
        v-if="selectedPlanet"
        class="absolute top-0 right-0 h-full w-1/5 bg-surface-900 border-l border-surface-700 z-10 flex flex-col"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <h2 class="text-base font-semibold text-blue-50 truncate">{{ selectedPlanet.name }}</h2>
          <button
            class="text-indigo-400 hover:text-blue-100 transition-colors p-1 -mr-1 shrink-0"
            @click="selectedPlanetSlug = null"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <!-- Size multiplier -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startSizeEdit">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="startSizeEdit">Size</span>
            </div>
            <div class="flex items-center gap-2">
              <template v-if="sizeEditing">
                <input v-model="sizeDraft" type="number" step="0.1" min="0.01"
                  class="w-24 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveSize" @keydown.escape="sizeEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors" @click="saveSize">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button class="text-red-400 hover:text-red-300 transition-colors" @click="sizeEditing = false">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </template>
              <span v-else class="text-xs font-mono text-indigo-400">×{{ selectedPlanet.size_multiplier ?? 1 }}</span>
            </div>
          </div>

          <!-- Orbit Position (0–1, blank = auto) -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startOrbitFractionEdit">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="startOrbitFractionEdit">Orbit Position</span>
            </div>
            <div class="flex items-center gap-2">
              <template v-if="orbitFractionEditing">
                <input v-model="orbitFractionDraft" type="number" step="0.05" min="0" max="1" placeholder="Auto"
                  class="w-24 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveOrbitFraction" @keydown.escape="orbitFractionEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors" @click="saveOrbitFraction">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button class="text-red-400 hover:text-red-300 transition-colors" @click="orbitFractionEditing = false">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </template>
              <template v-else>
                <span class="text-xs font-mono" :class="selectedPlanet.orbit_fraction != null ? 'text-indigo-400' : 'text-indigo-600 italic'">
                  {{ selectedPlanet.orbit_fraction != null ? selectedPlanet.orbit_fraction : 'Auto' }}
                </span>
                <button v-if="selectedPlanet.orbit_fraction != null"
                  class="text-indigo-600 hover:text-red-400 text-xs leading-none transition-colors"
                  title="Reset to auto"
                  @click="setOrbitFraction(selectedPlanet.slug, null)">×</button>
              </template>
            </div>
          </div>

          <!-- Ring count -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startRingCountEdit">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="startRingCountEdit">Ring Count</span>
            </div>
            <div class="flex items-center gap-2">
              <template v-if="ringCountEditing">
                <input v-model="ringCountDraft" type="number" step="1" min="0"
                  class="w-24 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveRingCount" @keydown.escape="ringCountEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors" @click="saveRingCount">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button class="text-red-400 hover:text-red-300 transition-colors" @click="ringCountEditing = false">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </template>
              <span v-else class="text-xs font-mono text-indigo-400">{{ selectedPlanet.ring_count ?? 0 }}</span>
            </div>
          </div>

          <!-- Planet Type -->
          <div>
            <span class="text-xs text-indigo-400 uppercase tracking-widest mb-1.5 block">Type</span>
            <div class="flex gap-1">
              <button v-for="opt in planetTypeOptions" :key="opt.value"
                class="flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors"
                :class="planetType === opt.value ? 'bg-accent-600 text-white' : 'bg-surface-700 text-indigo-400 hover:text-blue-100'"
                @click="setPlanetType(opt.value)"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- Uninhabited -->
          <div class="flex items-center justify-between">
            <span class="text-xs text-indigo-400 uppercase tracking-widest">Uninhabited</span>
            <span v-if="planetType !== 'normal'" class="text-xs text-indigo-600 italic">Auto</span>
            <button v-else
              class="relative inline-flex items-center h-5 w-9 rounded-full transition-colors focus:outline-none"
              :class="selectedPlanet.uninhabited ? 'bg-accent-600' : 'bg-surface-600'"
              @click="setUninhabited(selectedPlanet.slug, !selectedPlanet.uninhabited)"
            >
              <span class="inline-block w-3 h-3 bg-white rounded-full shadow transition-transform"
                :class="selectedPlanet.uninhabited ? 'translate-x-5' : 'translate-x-1'" />
            </button>
          </div>

          <!-- Color -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startColorEdit">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="startColorEdit">Color</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded-full shrink-0" :style="{ background: colorEditing ? colorDraft : selectedPlanet.color, boxShadow: `0 0 6px 2px ${colorEditing ? colorDraft : selectedPlanet.color}55` }" />
              <template v-if="colorEditing">
                <input ref="hexInputRef" v-model="colorDraft" type="text" maxlength="7" placeholder="#000000"
                  class="w-28 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveColor" @keydown.escape="colorEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors" @click="saveColor">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button class="text-red-400 hover:text-red-300 transition-colors" @click="colorEditing = false">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </template>
              <span v-else class="text-xs font-mono text-indigo-400">{{ selectedPlanet.color }}</span>
            </div>
          </div>

          <!-- Wiki -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="startWikiEdit">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="startWikiEdit">Wiki</span>
            </div>
            <template v-if="wikiEditing">
              <div class="flex items-center gap-2">
                <input ref="wikiInputRef" v-model="wikiDraft" type="url" placeholder="https://coppermind.net/wiki/…"
                  class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                  @keydown.enter="saveWiki" @keydown.escape="wikiEditing = false" />
                <button class="text-green-400 hover:text-green-300 transition-colors shrink-0" @click="saveWiki">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button class="text-red-400 hover:text-red-300 transition-colors shrink-0" @click="wikiEditing = false">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </template>
            <template v-else>
              <a v-if="selectedPlanet.wiki" :href="selectedPlanet.wiki" target="_blank" rel="noopener noreferrer"
                class="text-sm text-accent-400 hover:text-accent-300 transition-colors truncate block">
                {{ selectedPlanet.wiki }}
              </a>
              <span v-else class="text-sm text-indigo-600 italic">Not set</span>
            </template>
          </div>
          <!-- Moons -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="moonsEditing = !moonsEditing">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="moonsEditing = !moonsEditing">Moons</span>
            </div>
            <div class="space-y-1">
              <div v-for="moon in (selectedPlanet.moons ?? [])" :key="moon" class="flex items-center gap-2">
                <span class="flex-1 text-sm text-indigo-200">{{ moon }}</span>
                <template v-if="!moonsEditing">
                  <span v-if="(selectedPlanet.moon_orbit_fractions ?? {})[moon] != null"
                    class="text-xs font-mono text-indigo-500 shrink-0">{{ (selectedPlanet.moon_orbit_fractions ?? {})[moon] }}</span>
                  <span v-if="(selectedPlanet.polar_orbit_moons ?? []).includes(moon)"
                    class="text-xs text-indigo-500 italic shrink-0">polar</span>
                </template>
                <template v-else>
                  <input
                    type="number" step="0.05" min="0" max="1" placeholder="Auto"
                    :value="(selectedPlanet.moon_orbit_fractions ?? {})[moon] ?? ''"
                    @change="onMoonOrbitChange(moon, $event)"
                    class="w-16 bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-xs font-mono text-blue-100 placeholder-indigo-700 focus:outline-none focus:border-accent-500 transition-colors shrink-0"
                  />
                </template>
                <button v-if="moonsEditing"
                  :title="(selectedPlanet.polar_orbit_moons ?? []).includes(moon) ? 'Remove polar orbit' : 'Set polar orbit'"
                  class="text-xs px-1 py-0.5 rounded transition-colors shrink-0"
                  :class="(selectedPlanet.polar_orbit_moons ?? []).includes(moon) ? 'text-accent-400 bg-accent-900 hover:bg-surface-700' : 'text-indigo-600 hover:text-indigo-400'"
                  @click="toggleMoonPolarOrbit(moon)">P</button>
                <button v-if="moonsEditing" class="text-red-400 hover:text-red-300 text-lg leading-none transition-colors"
                  @click="updateMoons(selectedPlanet.slug, (selectedPlanet.moons ?? []).filter(m => m !== moon))">×</button>
              </div>
              <p v-if="!(selectedPlanet.moons ?? []).length" class="text-sm text-indigo-600 italic">None</p>
            </div>
            <div v-if="moonsEditing" class="flex gap-2 mt-2">
              <input v-model="newMoonName" type="text" placeholder="Moon name…"
                class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                @keydown.enter="addPanelMoon" />
              <button class="px-3 py-1 bg-accent-600 hover:bg-accent-500 text-white text-xs rounded-lg transition-colors" @click="addPanelMoon">Add</button>
            </div>
          </div>

          <!-- Orbit Events -->
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <button class="text-indigo-400 hover:text-blue-200 transition-colors" @click="orbitEventsEditing = !orbitEventsEditing">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <span class="text-xs text-indigo-400 uppercase tracking-widest cursor-pointer" @click="orbitEventsEditing = !orbitEventsEditing">Orbit Events</span>
            </div>
            <div class="space-y-1">
              <div v-for="(ev, i) in (selectedPlanet.orbit_events ?? [])" :key="i" class="flex items-center gap-2">
                <span class="flex-1 text-xs font-mono text-indigo-200 truncate">{{ ev.trigger_book }}</span>
                <span class="text-xs font-mono text-indigo-400 shrink-0">→ {{ ev.orbit_fraction }}</span>
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
                <span class="text-xs text-indigo-400 shrink-0">Fraction</span>
                <input v-model.number="newOrbitEventFraction" type="number" step="0.01" min="0" max="1"
                  class="w-20 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs font-mono text-blue-100 focus:outline-none focus:border-accent-500 transition-colors" />
                <button class="flex-1 px-3 py-1 bg-accent-600 hover:bg-accent-500 text-white text-xs rounded-lg transition-colors" @click="addOrbitEvent">Add</button>
              </div>
            </div>
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

definePageMeta({ layout: 'map' })

const { books, load } = useCosmere()
const { readSlugs, init: initRead } = useReadBooks()
const { planets, init: initPlanets, nodeData, setColor, setWiki, setSizeMultiplier, setRingCount, setUninhabited, setGasGiant, setDwarfPlanet, setOrbitFraction, setOrbitEvents, setPolarOrbitMoons, setMoonOrbitFractions, createPlanet, updateMoons, batchUpdatePositions, computeOrbitRadii } = usePlanetSettings()
const { systems, init: initSystems, batchUpdateSystemPositions, setSystemSize, updateSystemMembers, setStarName, setStarColor, setStarSupergiant, setBinary, setSecondaryStarName, setSecondaryStarColor, setSecondaryStarSize, setSecondaryStarOrbitFraction, setMemberLagrangePoint } = useSystemSettings()
const { editPositions, selectedPlanetSlug, selectedSystemSlug, zoomTarget } = useMapState()

const selectedSystem = computed(() =>
  systems.value.find(s => s.slug === selectedSystemSlug.value) ?? null
)

const selectedSystemPlanets = computed(() =>
  (selectedSystem.value?.members ?? [])
    .filter(m => m.type === 'planet')
    .map(m => planets.value.find(p => p.slug === m.slug))
    .filter(Boolean)
)

// System panel editing
const bodyTypeOptions = [
  { value: 'asteroid_belt', label: 'Asteroid Belt' },
  { value: 'comet_belt', label: 'Comet Belt' },
  { value: 'star', label: 'Star' },
]
const newPlanetName = ref('')
const newBodyType = ref('asteroid_belt')
const newStarBodyName = ref('')
watch(selectedSystemSlug, () => { newStarBodyName.value = '' })

const starNameEditing = ref(false)
const starNameDraft = ref('')
const starColorEditing = ref(false)
const starColorDraft = ref('')
watch(selectedSystemSlug, () => { starNameEditing.value = false; starColorEditing.value = false })

function startStarNameEdit() {
  starNameDraft.value = selectedSystem.value?.star_name ?? ''
  starNameEditing.value = true
}
async function saveStarName() {
  await setStarName(selectedSystem.value.slug, starNameDraft.value.trim())
  starNameEditing.value = false
}
function startStarColorEdit() {
  starColorDraft.value = selectedSystem.value?.star_color ?? '#ffcc44'
  starColorEditing.value = true
}
async function saveStarColor() {
  if (/^#[0-9a-f]{6}$/i.test(starColorDraft.value)) {
    await setStarColor(selectedSystem.value.slug, starColorDraft.value)
  }
  starColorEditing.value = false
}

// System size editing
const systemSizeEditing = ref(false)
const systemSizeDraft = ref('')
watch(selectedSystemSlug, () => { systemSizeEditing.value = false })
function startSystemSizeEdit() {
  const s = selectedSystem.value
  const allMembers = (s.members ?? []).filter(m => (typeof m === 'string') || m.type === 'planet').map(m => {
    const slug = typeof m === 'string' ? m : m.slug
    return planets.value.find(p => p.slug === slug)
  }).filter(Boolean)
  const totalPlanetSize = allMembers.reduce((sum, p) => sum + Math.floor(Math.max(0.1, p.size_multiplier ?? 1) * 64), 0)
  const auto = Math.max(150, totalPlanetSize * 8)
  systemSizeDraft.value = String(s.size ?? auto)
  systemSizeEditing.value = true
}
async function saveSystemSize() {
  const val = parseInt(systemSizeDraft.value, 10)
  if (!isNaN(val) && val >= 150) await setSystemSize(selectedSystem.value.slug, val)
  systemSizeEditing.value = false
}

// Secondary star editing
const secStarNameEditing = ref(false)
const secStarNameDraft = ref('')
const secStarColorEditing = ref(false)
const secStarColorDraft = ref('')
const secStarSizeEditing = ref(false)
const secStarSizeDraft = ref('')
const secStarOrbitEditing = ref(false)
const secStarOrbitDraft = ref('')
watch(selectedSystemSlug, () => {
  secStarNameEditing.value = false
  secStarColorEditing.value = false
  secStarSizeEditing.value = false
  secStarOrbitEditing.value = false
})
function startSecStarNameEdit() {
  secStarNameDraft.value = selectedSystem.value?.secondary_star_name ?? ''
  secStarNameEditing.value = true
}
async function saveSecStarName() {
  await setSecondaryStarName(selectedSystem.value.slug, secStarNameDraft.value.trim())
  secStarNameEditing.value = false
}
function startSecStarColorEdit() {
  secStarColorDraft.value = selectedSystem.value?.secondary_star_color ?? '#ff8844'
  secStarColorEditing.value = true
}
async function saveSecStarColor() {
  if (/^#[0-9a-f]{6}$/i.test(secStarColorDraft.value)) {
    await setSecondaryStarColor(selectedSystem.value.slug, secStarColorDraft.value)
  }
  secStarColorEditing.value = false
}
function startSecStarSizeEdit() {
  secStarSizeDraft.value = String(selectedSystem.value?.secondary_star_size ?? 0.5)
  secStarSizeEditing.value = true
}
async function saveSecStarSize() {
  const val = parseFloat(secStarSizeDraft.value)
  if (!isNaN(val) && val > 0) await setSecondaryStarSize(selectedSystem.value.slug, val)
  secStarSizeEditing.value = false
}
function startSecStarOrbitEdit() {
  secStarOrbitDraft.value = String(selectedSystem.value?.secondary_star_orbit_fraction ?? 0.65)
  secStarOrbitEditing.value = true
}
async function saveSecStarOrbit() {
  const val = parseFloat(secStarOrbitDraft.value)
  if (!isNaN(val) && val > 0 && val < 1) await setSecondaryStarOrbitFraction(selectedSystem.value.slug, val)
  secStarOrbitEditing.value = false
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

// Planet orbit fraction (static position override: 0.0 = inner edge, 1.0 = outer edge)
const orbitFractionEditing = ref(false)
const orbitFractionDraft = ref('')
watch(selectedPlanetSlug, () => { orbitFractionEditing.value = false })
function startOrbitFractionEdit() {
  const v = selectedPlanet.value?.orbit_fraction
  orbitFractionDraft.value = v != null ? String(v) : ''
  orbitFractionEditing.value = true
}
async function saveOrbitFraction() {
  const val = parseFloat(orbitFractionDraft.value)
  if (isNaN(val)) {
    await setOrbitFraction(selectedPlanet.value.slug, null)
  } else {
    await setOrbitFraction(selectedPlanet.value.slug, Math.min(1, Math.max(0, val)))
  }
  orbitFractionEditing.value = false
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
}

// Planet ring count editing
const ringCountEditing = ref(false)
const ringCountDraft = ref('')
watch(selectedPlanetSlug, () => { ringCountEditing.value = false })
function startRingCountEdit() {
  ringCountDraft.value = String(selectedPlanet.value?.ring_count ?? 0)
  ringCountEditing.value = true
}
async function saveRingCount() {
  const val = parseInt(ringCountDraft.value, 10)
  if (!isNaN(val) && val >= 0) await setRingCount(selectedPlanet.value.slug, val)
  ringCountEditing.value = false
}

const selectedPlanet = computed(() =>
  planets.value.find(p => p.slug === selectedPlanetSlug.value) ?? null
)

const colorEditing = ref(false)
const colorDraft = ref('')
const hexInputRef = ref(null)

const wikiEditing = ref(false)
const wikiDraft = ref('')
const wikiInputRef = ref(null)

watch(selectedPlanetSlug, () => { colorEditing.value = false; wikiEditing.value = false })

function startColorEdit() {
  colorDraft.value = selectedPlanet.value?.color ?? ''
  colorEditing.value = true
  nextTick(() => hexInputRef.value?.focus())
}

function saveColor() {
  if (/^#[0-9a-f]{6}$/i.test(colorDraft.value)) {
    setColor(selectedPlanet.value.slug, colorDraft.value)
  }
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

const moonsEditing = ref(false)
const newMoonName = ref('')
watch(selectedPlanetSlug, () => { moonsEditing.value = false; newMoonName.value = '' })

function addPanelMoon() {
  const name = newMoonName.value.trim()
  if (!name) return
  updateMoons(selectedPlanet.value.slug, [...(selectedPlanet.value.moons ?? []), name])
  newMoonName.value = ''
}

async function onMoonOrbitChange(moonName, event) {
  const val = parseFloat(event.target.value)
  const fractions = { ...(selectedPlanet.value.moon_orbit_fractions ?? {}) }
  if (isNaN(val)) {
    delete fractions[moonName]
  } else {
    fractions[moonName] = Math.min(1, Math.max(0, val))
  }
  await setMoonOrbitFractions(selectedPlanet.value.slug, fractions)
}

function toggleMoonPolarOrbit(moonName) {
  const current = selectedPlanet.value.polar_orbit_moons ?? []
  const next = current.includes(moonName)
    ? current.filter(m => m !== moonName)
    : [...current, moonName]
  setPolarOrbitMoons(selectedPlanet.value.slug, next)
}

// Orbit events editing
const orbitEventsEditing = ref(false)
const newOrbitEventBook = ref('')
const newOrbitEventFraction = ref(0.5)
watch(selectedPlanetSlug, () => {
  orbitEventsEditing.value = false
  newOrbitEventBook.value = ''
  newOrbitEventFraction.value = 0.5
})
async function deleteOrbitEvent(index) {
  const events = (selectedPlanet.value.orbit_events ?? []).filter((_, i) => i !== index)
  await setOrbitEvents(selectedPlanet.value.slug, events)
}
async function addOrbitEvent() {
  const bookSlug = newOrbitEventBook.value
  if (!bookSlug) return
  const fraction = Math.min(1, Math.max(0, parseFloat(newOrbitEventFraction.value)))
  if (isNaN(fraction)) return
  const events = [...(selectedPlanet.value.orbit_events ?? []), { trigger_book: bookSlug, orbit_fraction: fraction }]
  await setOrbitEvents(selectedPlanet.value.slug, events)
  newOrbitEventBook.value = ''
  newOrbitEventFraction.value = 0.5
}

function onKeyDown(e) {
  if (e.key !== 'Escape') return
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
    const hasVisible = system.always_visible || allMembers.some(p => visibleWorldIds.value.has(p.slug))
    if (!hasVisible) continue

    const totalPlanetSize = allMembers.reduce((sum, p) => sum + planetSize(p), 0)
    const size = system.size ?? Math.max(150, totalPlanetSize * 8)
    const inhabitedMembers = allMembers.filter(p => p.uninhabited !== true)
    const color = averageHexColors((inhabitedMembers.length ? inhabitedMembers : allMembers).map(p => p.color))

    // Orbit geometry — computed before push so fractions go into system node data
    const sunS = Math.max(6, Math.round(size * 0.08)) * (system.is_supergiant ? 3 : 1)
    const innerR = sunS / 2 + 4
    const outerR = size / 2 - 6
    const systemMemberList = system.members ?? system.planets ?? []
    const n = systemMemberList.length || allMembers.length
    const sysCX = system.map_x + size / 2
    const sysCY = system.map_y + size / 2
    const angle = -Math.PI / 2  // 12 o'clock
    const range = outerR - innerR

    // Binary star system support
    const isBinary = system.is_binary ?? false
    const secondaryOrbitFraction = system.secondary_star_orbit_fraction ?? 0.65
    const secondaryOrbitR = isBinary ? innerR + secondaryOrbitFraction * range : 0
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
    const nonLagrangeRadii = computeOrbitRadii(nonLagrangeMembers, innerR, outerR)
    let nlIdx = 0
    const orbitRadii = systemMemberList.map((m, i) => {
      if (isBinary && memberLagrangePoints[i]) return getLagrangePos(memberLagrangePoints[i]).r
      const r = nonLagrangeRadii[nlIdx] ?? (innerR + range / 2)
      nlIdx++
      return r
    })

    const memberOrbitFractions = orbitRadii.map((r, i) => {
      const member = systemMemberList[i]
      const mType = typeof member === 'string' ? 'planet' : member.type
      const mSlug = typeof member === 'string' ? member : member.slug
      const defaultFraction = range > 0 ? (r - innerR) / range : 0.5
      if (mType !== 'planet' || memberLagrangePoints[i]) return defaultFraction
      const planet = planets.value.find(p => p.slug === mSlug)
      if (planet?.orbit_fraction != null) return Math.min(1, Math.max(0, planet.orbit_fraction))
      return resolveOrbitFraction(planet?.orbit_events ?? [], defaultFraction, readSlugs.value)
    })

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
        isSupergiant: system.is_supergiant ?? false,
        isBinary,
        secondaryStarOrbitFraction: secondaryOrbitFraction,
        secondaryStarColor: system.secondary_star_color ?? '#ff8844',
        secondaryStarSize: system.secondary_star_size ?? 0.5,
        color,
        size,
        slug: system.slug,
        planetCount: allMembers.length,
        memberTypes: systemMemberList.map(m => typeof m === 'string' ? 'planet' : m.type),
        memberOrbitFractions,
        memberLagrangePoints,
      },
    })

    // Secondary star as a separate animatable node (animation loop drives its position)
    if (isBinary) {
      const ssRadius = Math.max(3, Math.round(sunS * (system.secondary_star_size ?? 0.5) / 2))
      planetNodes.push({
        id: `secondary-${system.slug}`,
        type: 'secondary-star',
        draggable: false,
        position: {
          x: sysCX + secondaryOrbitR * Math.cos(angle) - ssRadius,
          y: sysCY + secondaryOrbitR * Math.sin(angle) - ssRadius,
        },
        data: {
          color: system.secondary_star_color ?? '#ff8844',
          size: ssRadius * 2,
          systemSlug: system.slug,
        },
      })
    }

    // For each member, collect ALL possible orbit radii (default + every orbit_event
    // override). Lagrange members use only their fixed radius (no event overrides).
    const allPossibleOrbitR = systemMemberList.map((member, i) => {
      const type = typeof member === 'string' ? 'planet' : member.type
      const slug = typeof member === 'string' ? member : member.slug
      const defaultR = orbitRadii[i]
      if (type !== 'planet') return [defaultR]
      if (memberLagrangePoints[i]) return [defaultR]
      const planet = planets.value.find(p => p.slug === slug)
      if (planet?.orbit_fraction != null) return [innerR + Math.min(1, Math.max(0, planet.orbit_fraction)) * range]
      const eventRs = (planet?.orbit_events ?? []).map(ev =>
        innerR + Math.min(1, Math.max(0, ev.orbit_fraction)) * range
      )
      return [defaultR, ...eventRs]
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
      if (memberType !== 'planet') return
      const planet = planets.value.find(p => p.slug === slug)
      if (!planet) return
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
        orbitR = innerR + memberOrbitFractions[i] * range
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
      // Manual orbits start from the planet surface and scale with planet size
      const mManualBaseR = pSize / 2
      const mManualMaxR = isFinite(maxMoonOrbitR) ? maxMoonOrbitR : mManualBaseR + pSize * 10
      const polarOrbitMoonsSet = new Set(planet.polar_orbit_moons ?? [])
      const moonOrbitFractionMap = planet.moon_orbit_fractions ?? {}
      const moonOrbits = (planet.moons ?? []).map((moonName, mi) => {
        const mFrac = moonOrbitFractionMap[moonName]
        const isManual = mFrac != null
        const orbitR = isManual
          ? mManualBaseR + Math.min(1, Math.max(0, mFrac)) * (mManualMaxR - mManualBaseR)
          : mBaseR + mi * mSpacing
        return { orbitR, isPolarOrbit: polarOrbitMoonsSet.has(moonName), isManual }
      })

      planetNodes.push({
        id: planet.slug,
        type: 'planet',
        draggable: false,
        position: {
          x: sysCX + orbitR * Math.cos(posAngle) - pSize / 2,
          y: sysCY + orbitR * Math.sin(posAngle) - pSize / 2,
        },
        data: { ...nodeData(planet), systemSlug: system.slug, memberIndex: i, memberCount: n, maxMoonOrbitR, moonOrbits },
      })

      // Moon nodes — use pre-computed moonOrbits for radius and orbit type
      const slugSeed = planet.slug.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 10000, 0) / 10000
      moonOrbits.forEach((moonData, mi) => {
        const phaseOffset = (slugSeed + mi * 0.6180339887) % 1
        planetNodes.push({
          id: `moon-${planet.slug}-${mi}`,
          type: 'moon',
          draggable: false,
          position: { x: 0, y: 0 },  // driven by animation loop
          data: { parentSlug: planet.slug, index: mi, count: mCount, planetSize: pSize, phaseOffset, isPolarOrbit: moonData.isPolarOrbit, manualOrbitR: moonData.isManual ? moonData.orbitR : null },
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
