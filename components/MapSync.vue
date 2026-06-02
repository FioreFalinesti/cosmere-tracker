<template></template>

<script setup>
import { useVueFlow } from '@vue-flow/core'

const props = defineProps({
  nodes: { type: Array, required: true },
  edges: { type: Array, required: true },
})

const { setNodes, setEdges } = useVueFlow()

watch(() => props.nodes, nodes => setNodes(nodes), { immediate: true, deep: false })
watch(() => props.edges, edges => setEdges(edges), { immediate: true, deep: false })
</script>
