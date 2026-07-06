<template>
  <svg :viewBox="SHARD_ICON_VIEWBOX" :style="{ height: `${size}px`, width: 'auto', display: 'block' }">
    <path :d="SHARD_BG_PATH" :fill="color" :stroke="color" stroke-width="1" />
    <g transform="translate(0,152) scale(0.1,-0.1)" :fill="darkenHex(color)">
      <path :d="SHARD_ICON_PATH" />
    </g>
  </svg>
</template>

<script setup>
import { SHARD_ICON_VIEWBOX, SHARD_BG_PATH, SHARD_ICON_PATH } from '~/utils/shardIcon'
import { darkenHex } from '~/utils/colorUtils'

defineProps({
  color: { type: String, required: true },
  size: { type: Number, default: 16 },
})
</script>
