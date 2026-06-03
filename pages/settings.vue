<template>
  <div class="max-w-2xl">
    <h1 class="text-3xl font-bold text-blue-50 mb-8">Settings</h1>

    <section>
      <h2 class="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Data</h2>
      <div class="bg-surface-800 border border-surface-700 rounded-xl p-5 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-blue-100">Remove size from all systems</p>
            <p class="text-xs text-indigo-500 mt-0.5">Deletes the <code>size</code> field from every planetary system document.</p>
          </div>
          <button
            class="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 shrink-0"
            :disabled="running"
            @click="run"
          >
            {{ running ? 'Running…' : 'Run' }}
          </button>
        </div>
        <p v-if="status" class="text-xs px-3 py-2 rounded-lg" :class="status.ok ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'">
          {{ status.message }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
const { systems, init } = useSystemSettings()
await init()

const running = ref(false)
const status = ref(null)

async function run() {
  running.value = true
  status.value = null
  try {
    const { deleteField, doc, updateDoc } = await import('firebase/firestore')
    const db = useFirestore()
    await Promise.all(
      systems.value.map(s => updateDoc(doc(db, 'planetary_systems', s.slug), { size: deleteField() }))
    )
    status.value = { ok: true, message: `Removed size from ${systems.value.length} systems.` }
  } catch (e) {
    status.value = { ok: false, message: e.message }
  } finally {
    running.value = false
  }
}
</script>
