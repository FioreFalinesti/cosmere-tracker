<template><!-- map sync --></template>

<script setup>
import { useVueFlow } from '@vue-flow/core'

const props = defineProps({
  nodes: { type: Array, required: true },
  edges: { type: Array, required: true },
  editPositions: { type: Boolean, default: false },
})

const { setNodes, setEdges, getNodes } = useVueFlow()
const { planets, batchUpdatePositions } = usePlanetSettings()
const { batchUpdateSystemPositions } = useSystemSettings()

const originalPositions = ref({})

watch(() => props.nodes, nodes => {
  if (!props.editPositions) {
    setNodes(nodes)
  } else {
    const live = {}
    getNodes.value.forEach(n => { live[n.id] = n.position })
    setNodes(nodes.map(n => ({ ...n, position: live[n.id] ?? n.position })))
  }
}, { immediate: true, deep: false })

watch(() => props.edges, edges => setEdges(edges), { immediate: true, deep: false })

watch(() => props.editPositions, async (newVal, oldVal) => {
  if (newVal && !oldVal) {
    originalPositions.value = {}
    getNodes.value.forEach(n => { originalPositions.value[n.id] = { ...n.position } })
  }

  if (oldVal === true && newVal === false) {
    const allNodes = getNodes.value
    const planetUpdates = []
    const systemUpdates = []

    for (const n of allNodes) {
      const orig = originalPositions.value[n.id]
      if (!orig) continue
      const dx = Math.round(n.position.x) - Math.round(orig.x)
      const dy = Math.round(n.position.y) - Math.round(orig.y)
      if (dx === 0 && dy === 0) continue

      if (n.type === 'planet') {
        planetUpdates.push({ slug: n.id, map_x: Math.round(n.position.x), map_y: Math.round(n.position.y) })
      } else if (n.type === 'system') {
        const systemSlug = n.id.replace('system-', '')
        systemUpdates.push({ slug: systemSlug, map_x: Math.round(n.position.x), map_y: Math.round(n.position.y) })
      }
    }

    await Promise.all([
      planetUpdates.length ? batchUpdatePositions(planetUpdates) : Promise.resolve(),
      systemUpdates.length ? batchUpdateSystemPositions(systemUpdates) : Promise.resolve(),
    ])
  }
})
</script>
