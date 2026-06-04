<template><!-- map sync --></template>

<script setup>
import { useVueFlow } from '@vue-flow/core'

const props = defineProps({
  nodes: { type: Array, required: true },
  edges: { type: Array, required: true },
  editPositions: { type: Boolean, default: false },
})

const { setNodes, setEdges, getNodes, findNode, updateNode, setViewport, fitView, viewport, onNodeClick, onPaneClick, onNodeDragStart, onNodeDrag } = useVueFlow()
const { planets, batchUpdatePositions, computeOrbitRadii } = usePlanetSettings()
const { readSlugs } = useReadBooks()
const { systems, batchUpdateSystemPositions } = useSystemSettings()
const { viewingSystem, selectedPlanetSlug, selectedSystemSlug, zoomTarget, editCancelled, polarOrbitAngles } = useMapState()

const originalPositions = ref({})

// Re-fit viewport whenever the set of visible systems changes
let prevSystemKey = ''
function fitToSystems(nodes) {
  const systemIds = nodes.filter(n => n.type === 'system').map(n => n.id)
  if (systemIds.length === 0) return
  setTimeout(() => fitView({ nodes: systemIds, padding: 0.15, duration: 500 }), 100)
}

watch(() => props.nodes, nodes => {
  if (!props.editPositions) {
    // Always preserve the live position of system nodes. The editPositions watcher
    // (which saves and updates systems.value) runs AFTER this watcher due to Vue's
    // watcher registration order — so systems.value may not reflect the dragged
    // position yet. Using the live position prevents a one-frame revert on save.
    // For new systems (not yet in VueFlow), liveSystemPos will be empty and the
    // computed position from visibleNodes is used instead.
    const liveSystemPos = {}
    getNodes.value.forEach(n => {
      if (n.type === 'system') liveSystemPos[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) }
    })
    setNodes(nodes.map(n => n.type === 'system' && liveSystemPos[n.id]
      ? { ...n, position: liveSystemPos[n.id] }
      : n
    ))
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
const SPEED = 0.025
const MOON_SPEED = 0.0008
let animFrame = null

function orbitGeometry(system) {
  const systemNode = findNode(`system-${system.slug}`)
  if (!systemNode) return null
  const size = systemNode.style?.width ? parseFloat(systemNode.style.width) : 200
  const sunS = Math.max(6, Math.round(size * 0.08)) * (systemNode.data?.isSupergiant ? 3 : 1)
  const innerR = sunS / 2 + 4
  const outerR = size / 2 - 6
  const cx = systemNode.position.x + size / 2
  const cy = systemNode.position.y + size / 2
  const allMembers = system.members ?? system.planets ?? []
  return { innerR, outerR, cx, cy, allMembers }
}

function lagrangePos(lagrangePoint, secondaryOrbitR, secondaryAngle) {
  switch (lagrangePoint) {
    case 1: return { r: secondaryOrbitR * 0.78, a: secondaryAngle }
    case 2: return { r: secondaryOrbitR * 1.18, a: secondaryAngle }
    case 3: return { r: secondaryOrbitR, a: secondaryAngle + Math.PI }
    case 4: return { r: secondaryOrbitR, a: secondaryAngle - Math.PI / 3 }
    case 5: return { r: secondaryOrbitR, a: secondaryAngle + Math.PI / 3 }
    default: return { r: secondaryOrbitR, a: secondaryAngle }
  }
}

function animate() {
  if (!props.editPositions) {
    const t = performance.now()

    // Planet orbital animation
    for (const system of systems.value) {
      const geo = orbitGeometry(system)
      if (!geo) continue
      const { innerR, outerR, cx, cy, allMembers } = geo
      const n = allMembers.length
      if (n === 0) continue

      const orbitRadii = computeOrbitRadii(allMembers, innerR, outerR)
      const range = outerR - innerR

      allMembers.forEach((member, i) => {
        const slug = typeof member === 'string' ? member : member.slug
        const type = typeof member === 'string' ? 'planet' : member.type
        if (type !== 'planet') return
        if (typeof member === 'object' && member.lagrange_point) return  // fixed at Lagrange point
        const planet = planets.value.find(p => p.slug === slug)
        if (!planet) return
        const defaultFraction = range > 0 ? (orbitRadii[i] - innerR) / range : 0.5
        const fraction = planet.orbit_fraction != null
          ? Math.min(1, Math.max(0, planet.orbit_fraction))
          : resolveOrbitFraction(planet.orbit_events ?? [], defaultFraction, readSlugs.value)
        const orbitR = innerR + fraction * range
        const gravity = planet.gravity_multiplier ?? 1
        const ω = SPEED * gravity / Math.pow(orbitR, 1.5)
        const baseAngle = (i / n) * 2 * Math.PI - Math.PI / 2
        const angle = baseAngle + ω * t
        const pSize = Math.floor(Math.max(0.1, planet.size_multiplier ?? 1) * 64)
        if (planet.polar_orbit_moons?.length) polarOrbitAngles[slug] = angle + Math.PI / 2
        updateNode(slug, {
          position: {
            x: cx + orbitR * Math.cos(angle) - pSize / 2,
            y: cy + orbitR * Math.sin(angle) - pSize / 2,
          },
        })
      })
    }

    // Secondary star orbital animation + Lagrange planet co-rotation
    for (const system of systems.value) {
      if (!system.is_binary) continue
      const geo = orbitGeometry(system)
      if (!geo) continue
      const { innerR, outerR, cx, cy, allMembers } = geo
      const secondaryOrbitFraction = system.secondary_star_orbit_fraction ?? 0.65
      const secondaryOrbitR = innerR + secondaryOrbitFraction * (outerR - innerR)
      const ω = SPEED * 0.3 / Math.pow(secondaryOrbitR, 1.5)
      const secondaryAngle = -Math.PI / 2 + ω * t

      // Move secondary star node
      const ssNode = findNode(`secondary-${system.slug}`)
      if (ssNode) {
        const ssR = (ssNode.data?.size ?? 8) / 2
        updateNode(`secondary-${system.slug}`, {
          position: {
            x: cx + secondaryOrbitR * Math.cos(secondaryAngle) - ssR,
            y: cy + secondaryOrbitR * Math.sin(secondaryAngle) - ssR,
          },
        })
      }

      // Co-rotate Lagrange planets with secondary star
      allMembers.forEach(member => {
        if (typeof member !== 'object' || !member.lagrange_point) return
        const planet = planets.value.find(p => p.slug === member.slug)
        if (!planet) return
        const lp = lagrangePos(member.lagrange_point, secondaryOrbitR, secondaryAngle)
        if (planet.polar_orbit_moons?.length) polarOrbitAngles[member.slug] = lp.a + Math.PI / 2
        const pSize = Math.floor(Math.max(0.1, planet.size_multiplier ?? 1) * 64)
        updateNode(member.slug, {
          position: {
            x: cx + lp.r * Math.cos(lp.a) - pSize / 2,
            y: cy + lp.r * Math.sin(lp.a) - pSize / 2,
          },
        })
      })
    }

    // Moon animation
    for (const node of getNodes.value) {
      if (node.type !== 'moon') continue
      const { parentSlug, index, count, planetSize, phaseOffset, isPolarOrbit, manualOrbitR } = node.data
      const parentNode = findNode(parentSlug)
      if (!parentNode) continue
      const pCX = parentNode.position.x + planetSize / 2
      const pCY = parentNode.position.y + planetSize / 2
      const baseR = planetSize / 2 + 40
      const maxR = parentNode.data?.maxMoonOrbitR ?? Infinity
      const naturalMax = baseR + (count - 1) * 24
      const spacing = isFinite(maxR) && count > 1 && maxR < naturalMax
        ? (maxR - baseR) / (count - 1)
        : 24
      const orbitR = manualOrbitR ?? (baseR + index * spacing)
      const ω = MOON_SPEED / Math.sqrt(orbitR)
      const baseAngle = (phaseOffset ?? index / Math.max(count, 1)) * 2 * Math.PI

      if (isPolarOrbit) {
        // Oscillate along the perpendicular to the sun-planet line
        const systemSlug = parentNode.data?.systemSlug
        const systemNode = systemSlug ? findNode(`system-${systemSlug}`) : null
        const sysSize = systemNode?.style?.width ? parseFloat(systemNode.style.width) : 200
        const sysCX = systemNode ? systemNode.position.x + sysSize / 2 : pCX
        const sysCY = systemNode ? systemNode.position.y + sysSize / 2 : pCY
        const sunPlanetAngle = Math.atan2(pCY - sysCY, pCX - sysCX)
        const offset = orbitR * Math.sin(baseAngle + ω * t)
        updateNode(node.id, {
          position: {
            x: pCX - offset * Math.sin(sunPlanetAngle) - 2.5,
            y: pCY + offset * Math.cos(sunPlanetAngle) - 2.5,
          },
        })
      } else {
        const a = baseAngle + ω * t
        updateNode(node.id, { position: { x: pCX + orbitR * Math.cos(a) - 2.5, y: pCY + orbitR * Math.sin(a) - 2.5 } })
      }
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
  const availableW = panelOpen ? cw * 0.8 : cw
  const zoom = Math.min(Math.max((availableW * (1 - 2 * padding)) / size, 0.25), 4)
  const centerX = panelOpen ? availableW / 2 : cw / 2
  const centerY = ch / 2 - 30
  const vpX = centerX - (systemNode.position.x + size / 2) * zoom
  const vpY = centerY - (systemNode.position.y + size / 2) * zoom
  setViewport({ x: vpX, y: vpY, zoom }, { duration: 600 })
}

watch(zoomTarget, target => {
  if (!target) return
  nextTick(() => {
    if (target.type === 'planet') {
      const node = findNode(target.slug)
      if (!node) return
      const pSize = node.data?.size ?? 64
      const cw = window.innerWidth - 256
      const ch = window.innerHeight - 56
      const availableW = cw * 0.8  // account for panel
      const zoom = Math.min(4, Math.max(0.5, (availableW * 0.3) / pSize))
      const vpX = availableW / 2 - (node.position.x + pSize / 2) * zoom
      const vpY = ch / 2 - (node.position.y + pSize / 2) * zoom
      setViewport({ x: vpX, y: vpY, zoom }, { duration: 600 })
    } else if (target.type === 'system') {
      const systemNode = findNode(`system-${target.slug}`)
      if (systemNode) zoomToSystem(systemNode, true)
    }
    zoomTarget.value = null
  })
})

onPaneClick(() => { selectedPlanetSlug.value = null; selectedSystemSlug.value = null })

onNodeClick(({ node }) => {
  if (node.type === 'system') {
    selectedSystemSlug.value = node.data.slug
    selectedPlanetSlug.value = null
    zoomToSystem(node, true)
    return
  }
  if (node.type === 'planet') {
    selectedPlanetSlug.value = node.id
    selectedSystemSlug.value = null
    zoomTarget.value = { type: 'planet', slug: node.id }
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

onNodeDragStart(({ node }) => {
  if (!props.editPositions || node.type !== 'system') return
  dragStartPositions[node.id] = { ...node.position }
  const systemSlug = node.id.replace('system-', '')
  const system = systems.value.find(s => s.slug === systemSlug)
  const slugs = new Set(
    (system?.members ?? system?.planets ?? [])
      .filter(m => (typeof m === 'string') || m.type === 'planet')
      .map(m => typeof m === 'string' ? m : m.slug)
  )
  getNodes.value.forEach(n => {
    if ((n.type === 'planet' && slugs.has(n.id)) ||
        (n.type === 'moon' && slugs.has(n.data.parentSlug)) ||
        (n.type === 'secondary-star' && n.data.systemSlug === systemSlug)) {
      dragStartPositions[n.id] = { ...n.position }
    }
  })
})

onNodeDrag(({ node }) => {
  if (!props.editPositions || node.type !== 'system') return
  const start = dragStartPositions[node.id]
  if (!start) return
  const dx = node.position.x - start.x
  const dy = node.position.y - start.y
  const systemSlug = node.id.replace('system-', '')
  const system = systems.value.find(s => s.slug === systemSlug)
  const slugs = new Set(
    (system?.members ?? system?.planets ?? [])
      .filter(m => (typeof m === 'string') || m.type === 'planet')
      .map(m => typeof m === 'string' ? m : m.slug)
  )
  getNodes.value.forEach(n => {
    if ((n.type === 'planet' && slugs.has(n.id)) ||
        (n.type === 'moon' && slugs.has(n.data.parentSlug)) ||
        (n.type === 'secondary-star' && n.data.systemSlug === systemSlug)) {
      const ps = dragStartPositions[n.id]
      if (ps) updateNode(n.id, { position: { x: ps.x + dx, y: ps.y + dy } })
    }
  })
})

const dragStartPositions = {}

watch(() => props.editPositions, async (newVal, oldVal) => {
  if (newVal && !oldVal) {
    originalPositions.value = {}
    getNodes.value.forEach(n => { originalPositions.value[n.id] = { ...n.position } })
  }

  if (oldVal === true && newVal === false) {
    if (editCancelled.value) {
      setNodes(getNodes.value.map(n => ({
        ...n,
        position: originalPositions.value[n.id] ?? n.position,
      })))
    } else {
      const allNodes = getNodes.value
      const systemUpdates = []
      for (const n of allNodes) {
        const orig = originalPositions.value[n.id]
        if (!orig) continue
        const dx = Math.round(n.position.x) - Math.round(orig.x)
        const dy = Math.round(n.position.y) - Math.round(orig.y)
        if (dx === 0 && dy === 0) continue
        if (n.type === 'system') {
          systemUpdates.push({ slug: n.id.replace('system-', ''), map_x: Math.round(n.position.x), map_y: Math.round(n.position.y) })
        }
      }
      await Promise.all([
        systemUpdates.length ? batchUpdateSystemPositions(systemUpdates) : Promise.resolve(),
      ])
    }
  }
})
</script>
