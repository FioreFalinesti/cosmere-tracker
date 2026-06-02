<template>
  <div class="max-w-2xl">
    <h1 class="text-3xl font-bold text-blue-50 mb-8">Settings</h1>

    <section>
      <h2 class="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Planets</h2>
      <div class="bg-surface-800 border border-surface-700 rounded-xl divide-y divide-surface-700">
        <div
          v-for="planet in planets"
          :key="planet.slug"
          class="flex items-center gap-4 px-5 py-3"
        >
          <div
            class="w-4 h-4 rounded-full shrink-0"
            :style="{ background: getColor(planet.slug), boxShadow: `0 0 6px 1px ${getColor(planet.slug)}55` }"
          />
          <span class="flex-1 text-sm text-blue-100">{{ planet.name }}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs text-indigo-500 font-mono">{{ getColor(planet.slug) }}</span>
            <input
              type="color"
              :value="getColor(planet.slug)"
              class="color-swatch"
              @input="e => setColor(planet.slug, e.target.value)"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const { planets, init, getColor, setColor } = usePlanetSettings()
await init()
</script>

<style scoped>
.color-swatch {
  appearance: none;
  -webkit-appearance: none;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: none;
}
.color-swatch::-webkit-color-swatch-wrapper { padding: 0; }
.color-swatch::-webkit-color-swatch { border: none; border-radius: 6px; }
.color-swatch::-moz-color-swatch { border: none; border-radius: 6px; }
</style>
