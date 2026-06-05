<template>
  <div class="max-w-2xl">
    <h1 class="text-3xl font-bold text-blue-50 mb-8">Settings</h1>

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
await init()

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
</script>
