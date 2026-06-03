<template>
  <div class="max-w-[500px]">
    <h1 class="text-3xl font-bold text-blue-50 mb-8">Settings</h1>

    <section>
      <h2 class="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Systems &amp; Planets</h2>
      <div class="bg-surface-800 border border-surface-700 rounded-xl divide-y divide-surface-700">
        <div v-for="system in systems" :key="system.slug" class="px-5 py-4">

          <!-- Accordion header -->
          <button class="flex items-center gap-2 w-full text-left" @click="expanded[system.slug] = !expanded[system.slug]">
            <div class="w-3 h-3 rounded-full shrink-0" :style="{ background: systemColor(system), boxShadow: `0 0 4px 1px ${systemColor(system)}66` }" />
            <p class="flex-1 text-sm font-semibold text-blue-100">{{ system.name }}</p>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-indigo-500 transition-transform shrink-0" :class="expanded[system.slug] ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Expanded content -->
          <div v-if="expanded[system.slug]" class="mt-3 space-y-2">

            <!-- Unified members list -->
            <div v-for="(member, mi) in (system.members ?? [])" :key="mi">
              <div class="flex items-center gap-3 bg-surface-700 rounded-lg px-3 py-2">
                <span class="text-xs text-indigo-500 w-4 text-center shrink-0">{{ mi + 1 }}</span>
                <template v-if="member.type === 'planet'">
                  <div v-if="!planetData(member.slug)?.uninhabited" class="w-2.5 h-2.5 rounded-full shrink-0"
                    :style="{ background: planetData(member.slug)?.color, boxShadow: `0 0 4px 1px ${planetData(member.slug)?.color}66` }" />
                  <span class="flex-1 text-sm text-blue-100">{{ planetName(member.slug) }}</span>
                </template>
                <template v-else>
                  <span class="flex-1 text-sm text-indigo-300 italic">{{ bodyLabel(member.type) }}</span>
                </template>
                <div class="flex gap-1 shrink-0">
                  <button class="text-indigo-400 hover:text-blue-100 disabled:opacity-30 px-1 transition-colors" :disabled="mi === 0" @click="moveMember(system, mi, -1)">↑</button>
                  <button class="text-indigo-400 hover:text-blue-100 disabled:opacity-30 px-1 transition-colors" :disabled="mi === (system.members ?? []).length - 1" @click="moveMember(system, mi, 1)">↓</button>
                  <button class="text-red-400 hover:text-red-300 text-sm px-1 transition-colors" @click="removeMember(system, mi)">×</button>
                </div>
              </div>
              <!-- Moons (planets only) -->
              <div v-if="member.type === 'planet'" class="ml-7 mt-1.5 space-y-1">
                <div v-for="moon in (planetMoons(member.slug))" :key="moon" class="flex gap-2 justify-end">
                  <span class="w-[200px] text-xs text-indigo-300 truncate">{{ moon }}</span>
                  <button class="px-2 py-0.5 text-xs text-red-400 hover:text-red-300 transition-colors" @click="removeMoon(member.slug, moon)">×</button>
                </div>
                <div class="flex gap-2 mt-1 justify-end">
                  <input v-model="newMoonInputs[member.slug]" type="text" placeholder="Add moon…"
                    class="w-[200px] bg-surface-700 border border-surface-600 rounded px-2 py-0.5 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                    @keydown.enter="addMoon(member.slug)" />
                  <button class="px-2 py-0.5 bg-accent-600 hover:bg-accent-500 text-white text-xs rounded transition-colors" @click="addMoon(member.slug)">+</button>
                </div>
              </div>
            </div>

            <!-- Add controls -->
            <div class="flex gap-2 pt-2 border-t border-surface-700">
              <input v-model="newPlanetInputs[system.slug]" type="text" placeholder="New planet name…"
                class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
                @keydown.enter="addPlanet(system)" />
              <button class="px-3 py-1 bg-accent-600 hover:bg-accent-500 text-white text-xs rounded-lg transition-colors shrink-0" @click="addPlanet(system)">Add Planet</button>
            </div>
            <p v-if="addPlanetStatus[system.slug]" class="text-xs text-green-400">{{ addPlanetStatus[system.slug] }}</p>
            <div class="flex gap-2">
              <select v-model="newBodyTypes[system.slug]"
                class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-xs text-blue-100 focus:outline-none focus:border-accent-500 transition-colors">
                <option v-for="opt in bodyTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <button class="px-3 py-1 bg-surface-600 hover:bg-surface-500 text-blue-100 text-xs rounded-lg transition-colors shrink-0" @click="addBody(system)">Add Body</button>
            </div>

          </div><!-- /expanded -->
        </div>
      </div>
      <p v-if="saveStatus" class="mt-3 text-xs text-green-400">{{ saveStatus }}</p>
    </section>

  </div>
</template>

<script setup>
import { doc, updateDoc, setDoc, collection } from 'firebase/firestore'
import { averageHexColors } from '~/utils/colorUtils'

const { systems, init: initSystems } = useSystemSettings()
const { planets, init: initPlanets, updateMoons } = usePlanetSettings()
await initSystems()
await initPlanets()

const saveStatus = ref('')
const expanded = reactive({})
const newMoonInputs = reactive({})
const newPlanetInputs = reactive({})
const addPlanetStatus = reactive({})
const newBodyTypes = reactive({})

const bodyTypeOptions = [
  { value: 'asteroid_belt', label: 'Asteroid Belt' },
  { value: 'comet_belt', label: 'Comet Belt' },
]

function systemColor(system) {
  const members = (system.planets ?? [])
    .map(slug => planets.value.find(p => p.slug === slug))
    .filter(p => p && !p.uninhabited)
  return averageHexColors(members.map(p => p.color))
}

function planetData(slug) { return planets.value.find(p => p.slug === slug) }
function planetName(slug) { return planetData(slug)?.name ?? slug }
function planetMoons(slug) { return planetData(slug)?.moons ?? [] }
function bodyLabel(type) { return bodyTypeOptions.find(o => o.value === type)?.label ?? type }

async function saveMembers(system, members) {
  system.members = members
  const db = useFirestore()
  await updateDoc(doc(db, 'planetary_systems', system.slug), { members })
  saveStatus.value = `Saved ${system.name}`
  setTimeout(() => saveStatus.value = '', 2000)
}

function moveMember(system, i, dir) {
  const arr = [...(system.members ?? [])]
  const j = i + dir
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
  saveMembers(system, arr)
}

function removeMember(system, i) {
  saveMembers(system, (system.members ?? []).filter((_, idx) => idx !== i))
}

async function addPlanet(system) {
  const name = (newPlanetInputs[system.slug] ?? '').trim()
  if (!name) return
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const db = useFirestore()
  await setDoc(doc(collection(db, 'planets'), slug), {
    name, color: '#888888', size_multiplier: 1, gravity_multiplier: 1,
    wiki: '', uninhabited: false, moons: [],
  })
  const members = [...(system.members ?? []), { type: 'planet', slug }]
  await updateDoc(doc(db, 'planetary_systems', system.slug), { members })
  system.members = members
  newPlanetInputs[system.slug] = ''
  addPlanetStatus[system.slug] = `Added ${name}`
  setTimeout(() => { addPlanetStatus[system.slug] = '' }, 2000)
}

async function addBody(system) {
  const type = newBodyTypes[system.slug] || 'asteroid_belt'
  saveMembers(system, [...(system.members ?? []), { type }])
}


function addMoon(slug) {
  const name = (newMoonInputs[slug] ?? '').trim()
  if (!name) return
  updateMoons(slug, [...planetMoons(slug), name])
  newMoonInputs[slug] = ''
}

function removeMoon(slug, moon) {
  updateMoons(slug, planetMoons(slug).filter(m => m !== moon))
}
</script>
