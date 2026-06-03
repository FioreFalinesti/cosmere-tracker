<template>
  <div class="max-w-5xl">
    <h1 class="text-3xl font-bold text-blue-50 mb-8">Settings</h1>

    <div class="flex gap-8 items-start">
      <section class="flex-1 min-w-0">
        <h2 class="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Planet Order</h2>
        <div class="bg-surface-800 border border-surface-700 rounded-xl divide-y divide-surface-700">
          <div v-for="system in systems" :key="system.slug" class="px-5 py-4">
            <p class="text-sm font-medium text-blue-100 mb-3">{{ system.name }}</p>
            <div class="space-y-1.5">
              <div
                v-for="(slug, i) in (system.planets ?? [])"
                :key="slug"
                class="flex items-center gap-3 bg-surface-700 rounded-lg px-3 py-2"
              >
                <span class="text-xs text-indigo-500 w-4 text-center">{{ i + 1 }}</span>
                <span class="flex-1 text-sm text-blue-100">{{ planetName(slug) }}</span>
                <div class="flex gap-1">
                  <button
                    class="text-indigo-400 hover:text-blue-100 transition-colors disabled:opacity-30 px-1"
                    :disabled="i === 0"
                    @click="moveUp(system, i)"
                  >↑</button>
                  <button
                    class="text-indigo-400 hover:text-blue-100 transition-colors disabled:opacity-30 px-1"
                    :disabled="i === (system.planets ?? []).length - 1"
                    @click="moveDown(system, i)"
                  >↓</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p v-if="saveStatus" class="mt-3 text-xs text-green-400">{{ saveStatus }}</p>
      </section>

      <section class="flex-1 min-w-0">
      </section>
    </div>
  </div>
</template>

<script setup>
import { doc, updateDoc } from 'firebase/firestore'

const { systems, init: initSystems } = useSystemSettings()
const { planets, init: initPlanets } = usePlanetSettings()
await initSystems()
await initPlanets()

const saveStatus = ref('')

function planetName(slug) {
  return planets.value.find(p => p.slug === slug)?.name ?? slug
}

async function reorder(system, newPlanets) {
  system.planets = newPlanets
  const db = useFirestore()
  await updateDoc(doc(db, 'planetary_systems', system.slug), { planets: newPlanets })
  saveStatus.value = `Saved ${system.name}`
  setTimeout(() => saveStatus.value = '', 2000)
}

function moveUp(system, i) {
  const arr = [...(system.planets ?? [])]
  ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
  reorder(system, arr)
}

function moveDown(system, i) {
  const arr = [...(system.planets ?? [])]
  ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
  reorder(system, arr)
}
</script>
