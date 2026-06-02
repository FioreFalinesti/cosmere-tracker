<template>
  <div class="planet-node" :class="{ 'planet-node--selected': selected }">
    <div
      class="planet-orb"
      :style="{
        width: `${data.size}px`,
        height: `${data.size}px`,
        background: `radial-gradient(circle at 35% 35%, white 0%, ${data.color} 40%, ${data.colorDark} 100%)`,
        boxShadow: `0 0 ${data.size * 0.6}px ${data.size * 0.2}px ${data.color}55, 0 0 ${data.size * 1.5}px ${data.size * 0.15}px ${data.color}22`,
      }"
    />
    <div class="planet-label">
      <p class="planet-name" :style="{ color: data.color }">{{ data.name }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})
</script>

<style scoped>
.planet-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: default;
  user-select: none;
}

.planet-orb {
  border-radius: 50%;
  transition: box-shadow 0.2s ease;
  flex-shrink: 0;
}

.planet-node:hover .planet-orb {
  filter: brightness(1.15);
}

.planet-label {
  text-align: center;
}

.planet-name {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.2;
}

.planet-shard {
  font-size: 10px;
  color: #6b7ea8;
  margin-top: 2px;
  line-height: 1.3;
  max-width: 130px;
}
</style>
