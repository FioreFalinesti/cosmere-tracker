<template><!-- map sync --></template>

<script setup>
import { useVueFlow } from '@vue-flow/core'

const props = defineProps({
  nodes: { type: Array, required: true },
  edges: { type: Array, required: true },
  editPositions: { type: Boolean, default: false },
})

const { setNodes, setEdges, getNodes, findNode, updateNode, onNodeDragStart, onNodeDrag } = useVueFlow()
const { planets, batchUpdatePositions } = usePlanetSettings()
const { systems, batchUpdateSystemPositions } = useSystemSettings()

const originalPositions = ref({})
const dragStartPositions = {}

// Sync nodes — in edit mode preserve dragged positions for existing nodes
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

// When a system drag starts, snapshot starting positions of system + member planets
onNodeDragStart(({ node }) => {
  if (!props.editPositions || node.type !== 'system') return
  dragStartPositions[node.id] = { ...node.position }
  const systemSlug = node.id.replace('system-', '')
  const system = systems.value.find(s => s.slug === systemSlug)
  ;(system?.planets ?? []).map(slug => planets.value.find(p => p.slug === slug)).filter(Boolean)
    .forEach(p => {
      const planetNode = findNode(p.slug)
      if (planetNode) dragStartPositions[p.slug] = { ...planetNode.position }
    })
})

// During drag, move member planets by the same delta as the system
onNodeDrag(({ node }) => {
  if (!props.editPositions || node.type !== 'system') return
  const start = dragStartPositions[node.id]
  if (!start) return
  const dx = node.position.x - start.x
  const dy = node.position.y - start.y
  const systemSlug = node.id.replace('system-', '')
  const system = systems.value.find(s => s.slug === systemSlug)
  ;(system?.planets ?? []).map(slug => planets.value.find(p => p.slug === slug)).filter(Boolean)
    .forEach(p => {
      const planetStart = dragStartPositions[p.slug]
      if (planetStart) {
        updateNode(p.slug, { position: { x: planetStart.x + dx, y: planetStart.y + dy } })
      }
    })
})

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
