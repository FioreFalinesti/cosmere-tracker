<template>
  <div class="planet-node" :class="{ 'planet-node--selected': selected }">
    <div
      class="planet-orb"
      :style="{
        width: `${data.size}px`,
        height: `${data.size}px`,
        background: `radial-gradient(circle at 35% 35%, white 0%, ${data.color} 40%, ${data.colorDark} 100%)`,
        boxShadow: `0 0 ${data.size * 0.3}px ${data.size * 0.08}px ${data.color}33, 0 0 ${data.size * 0.7}px ${data.size * 0.05}px ${data.color}11`,
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
  cursor: pointer;
  user-select: none;
}

.planet-orb {
  border-radius: 50%;
  transition: box-shadow 0.2s ease;
  flex-shrink: 0;
}

.planet-label {
  text-align: center;
}

.planet-name {
  font-size: 8px;
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
