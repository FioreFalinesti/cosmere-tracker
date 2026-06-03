<template><!-- map sync --></template>

<script setup>
import { useVueFlow } from '@vue-flow/core'

const props = defineProps({
  nodes: { type: Array, required: true },
  edges: { type: Array, required: true },
  editPositions: { type: Boolean, default: false },
})

const { setNodes, setEdges, getNodes, findNode, updateNode, setViewport, fitView, viewport, onNodeClick, onPaneClick, onNodeDragStart, onNodeDrag } = useVueFlow()
const { planets, batchUpdatePositions } = usePlanetSettings()
const { systems, batchUpdateSystemPositions } = useSystemSettings()
const { viewingSystem, selectedPlanetSlug } = useMapState()

const originalPositions = ref({})

watch(viewingSystem, val => console.log('[viewingSystem]', val))

// Re-fit viewport whenever the set of visible systems changes
let prevSystemKey = ''
function fitToSystems(nodes) {
  const systemIds = nodes.filter(n => n.type === 'system').map(n => n.id)
  if (systemIds.length === 0) return
  setTimeout(() => fitView({ nodes: systemIds, padding: 0.15, duration: 500 }), 100)
}

// Sync nodes — in edit mode preserve dragged positions for existing nodes
watch(() => props.nodes, nodes => {
  if (!props.editPositions) {
    setNodes(nodes)
    const systemKey = nodes.filter(n => n.type === 'system').map(n => n.id).sort().join(',')
    if (systemKey !== prevSystemKey) {
      fitToSystems(nodes)
      prevSystemKey = systemKey
    }
  } else {
    const live = {}
    getNodes.value.forEach(n => { live[n.id] = n.position })
    setNodes(nodes.map(n => ({ ...n, position: live[n.id] ?? n.position })))
  }
}, { immediate: true, deep: false })

watch(() => props.edges, edges => setEdges(edges), { immediate: true, deep: false })

// ── Orbital animation ─────────────────────────────────────────────────────────
// ω ∝ gravity_multiplier / orbitRadius^1.5  (Kepler-inspired: inner planets faster)
const SPEED = 0.025  // global speed factor (rad per ms at ref orbit radius)
let animFrame = null

function orbitGeometry(system) {
  const systemNode = findNode(`system-${system.slug}`)
  if (!systemNode) return null
  const size = systemNode.style?.width ? parseFloat(systemNode.style.width) : 200
  const sunS = Math.max(6, Math.round(size * 0.08))
  const innerR = sunS / 2 + 4
  const outerR = size / 2 - 6
  const cx = systemNode.position.x + size / 2
  const cy = systemNode.position.y + size / 2
  return { innerR, outerR, cx, cy, members: system.planets ?? [] }
}

function animate() {
  if (!props.editPositions) {
    const t = performance.now()

    for (const system of systems.value) {
      const geo = orbitGeometry(system)
      if (!geo) continue
      const { innerR, outerR, cx, cy, members } = geo
      const n = members.length
      if (n === 0) continue

      members.forEach((slug, i) => {
        const planet = planets.value.find(p => p.slug === slug)
        if (!planet) return

        const orbitR = innerR + (outerR - innerR) * (i + 1) / (n + 1)
        const gravity = planet.gravity_multiplier ?? 1
        const ω = SPEED * gravity / Math.pow(orbitR, 1.5)
        const baseAngle = (i / n) * 2 * Math.PI - Math.PI / 2
        const angle = baseAngle + ω * t

        const pSize = Math.floor(Math.max(0.1, planet.size_multiplier ?? 1) * 64)
        updateNode(slug, {
          position: {
            x: cx + orbitR * Math.cos(angle) - pSize / 2,
            y: cy + orbitR * Math.sin(angle) - pSize / 2,
          },
        })
      })
    }
  }
  animFrame = requestAnimationFrame(animate)
}

onMounted(() => { animFrame = requestAnimationFrame(animate) })
onUnmounted(() => { if (animFrame) cancelAnimationFrame(animFrame) })
// ─────────────────────────────────────────────────────────────────────────────

function zoomToSystem(systemNode, panelOpen = false) {
  const size = systemNode.style?.width ? parseFloat(systemNode.style.width) : 200
  const cw = window.innerWidth - 256
  const ch = window.innerHeight - 56
  const padding = 0.3
  const availableW = panelOpen ? cw * 0.6 : cw

  const zoom = Math.min(Math.max((availableW * (1 - 2 * padding)) / size, 0.25), 4)
  const centerX = panelOpen ? availableW / 2 : cw / 2
  const centerY = ch / 2 - 30  // shift up to give the system name label room below
  const vpX = centerX - (systemNode.position.x + size / 2) * zoom
  const vpY = centerY - (systemNode.position.y + size / 2) * zoom

  setViewport({ x: vpX, y: vpY, zoom }, { duration: 600 })
}

onPaneClick(() => { selectedPlanetSlug.value = null })

onNodeClick(({ node }) => {
  if (node.type === 'system') {
    zoomToSystem(node, selectedPlanetSlug.value !== null)
    return
  }

  if (node.type === 'planet') {
    if (!viewingSystem.value) {
      const system = systems.value.find(s => (s.planets ?? []).includes(node.id))
      if (system) {
        const systemNode = findNode(`system-${system.slug}`)
        if (systemNode) zoomToSystem(systemNode, false)
      }
    } else {
      selectedPlanetSlug.value = node.id
      const systemNode = findNode(`system-${viewingSystem.value}`)
      if (systemNode) zoomToSystem(systemNode, true)
    }
  }
})

// Track which system (if any) is the sole visible one in the viewport
watchEffect(() => {
  const vp = viewport.value
  const cw = window.innerWidth - 256
  const ch = window.innerHeight - 56

  const visibleSystems = props.nodes.filter(n => {
    if (n.type !== 'system') return false
    const size = n.style?.width ? parseFloat(n.style.width) : 200
    const sl = n.position.x * vp.zoom + vp.x
    const sr = (n.position.x + size) * vp.zoom + vp.x
    const st = n.position.y * vp.zoom + vp.y
    const sb = (n.position.y + size) * vp.zoom + vp.y
    return sr > 0 && sl < cw && sb > 0 && st < ch
  })

  viewingSystem.value = visibleSystems.length === 1 ? visibleSystems[0].data.slug : null
})

// When a system drag starts, snapshot positions of system + member planets
onNodeDragStart(({ node }) => {
  if (!props.editPositions || node.type !== 'system') return
  dragStartPositions[node.id] = { ...node.position }
  const systemSlug = node.id.replace('system-', '')
  const system = systems.value.find(s => s.slug === systemSlug)
  ;(system?.planets ?? [])
    .map(slug => planets.value.find(p => p.slug === slug))
    .filter(Boolean)
    .forEach(p => {
      const pn = findNode(p.slug)
      if (pn) dragStartPositions[p.slug] = { ...pn.position }
    })
})

// During a system drag, move member planets by the same delta
onNodeDrag(({ node }) => {
  if (!props.editPositions || node.type !== 'system') return
  const start = dragStartPositions[node.id]
  if (!start) return
  const dx = node.position.x - start.x
  const dy = node.position.y - start.y
  const systemSlug = node.id.replace('system-', '')
  const system = systems.value.find(s => s.slug === systemSlug)
  ;(system?.planets ?? [])
    .map(slug => planets.value.find(p => p.slug === slug))
    .filter(Boolean)
    .forEach(p => {
      const ps = dragStartPositions[p.slug]
      if (ps) updateNode(p.slug, { position: { x: ps.x + dx, y: ps.y + dy } })
    })
})

const dragStartPositions = {}

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
        systemUpdates.push({ slug: n.id.replace('system-', ''), map_x: Math.round(n.position.x), map_y: Math.round(n.position.y) })
      }
    }

    await Promise.all([
      planetUpdates.length ? batchUpdatePositions(planetUpdates) : Promise.resolve(),
      systemUpdates.length ? batchUpdateSystemPositions(systemUpdates) : Promise.resolve(),
    ])
  }
})
</script>
