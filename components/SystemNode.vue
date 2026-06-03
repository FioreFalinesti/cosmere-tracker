<template>
  <div class="system-container">
    <div class="system-circle-wrap" :style="{ width: `${data.size}px`, height: `${data.size}px` }">
      <div class="system-circle" :style="circleStyle" />
      <div class="system-sun" :style="sunStyle" />
    </div>
    <p class="system-label" :style="{ color: `${data.color}aa` }">{{ data.name }}</p>
    <p v-if="data.starName" class="star-label" :style="{ color: `${data.color}66` }">{{ data.starName }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

const sunSize = computed(() => Math.max(6, Math.round(props.data.size * 0.08)))

const circleStyle = computed(() => ({
  width: '100%',
  height: '100%',
  background: `radial-gradient(circle, #07091a 0%, #020308 100%)`,
  border: `2px solid ${props.data.color}55`,
  boxShadow: [
    `0 0 ${props.data.size * 0.35}px ${props.data.size * 0.06}px ${props.data.color}33`,
    `0 0 ${props.data.size * 0.12}px ${props.data.color}66`,
    `inset 0 0 ${props.data.size * 0.25}px ${props.data.color}0d`,
  ].join(', '),
}))

const sunStyle = computed(() => ({
  width: `${sunSize.value}px`,
  height: `${sunSize.value}px`,
  background: `radial-gradient(circle, #ffffff 0%, #fff5c0 50%, #ffcc44 100%)`,
  boxShadow: `0 0 ${sunSize.value * 1.5}px ${sunSize.value * 0.5}px #ffcc4466, 0 0 ${sunSize.value * 3}px ${sunSize.value}px #ffcc4422`,
}))
</script>

<style scoped>
.system-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.system-circle-wrap {
  position: relative;
  flex-shrink: 0;
}

.system-circle {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.system-sun {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.system-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.2;
  text-align: center;
}

.star-label {
  font-size: 9px;
  letter-spacing: 0.04em;
  line-height: 1.2;
  text-align: center;
  margin-top: -6px;
}
</style>
