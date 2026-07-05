<template><!-- map sync --></template>

<script setup>
import { useVueFlow } from '@vue-flow/core'
import { resolveOrbitDistance } from '~/utils/orbitUtils'

const props = defineProps({
  nodes: { type: Array, required: true },
  editPositions: { type: Boolean, default: false },
})

const { setNodes, getNodes, findNode, updateNode, setViewport, fitView, viewport, onNodeClick, onPaneClick, onNodeDragStart, onNodeDrag } = useVueFlow()
const { planets, computeOrbitRadii } = usePlanetSettings()
const { systems, batchUpdateSystemPositions } = useSystemSettings()
const { events: timelineEvents, nowYear } = useTimelineEvents()
const { viewingSystem, selectedPlanetSlug, selectedSystemSlug, selectedBodyMemberIndex, zoomTarget, editCancelled, polarOrbitAngles, orbitEventPreview } = useMapState()

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

// ── Orbital animation ─────────────────────────────────────────────────────────
const SPEED = 0.025
const MOON_SPEED = 0.0008
let animFrame = null
const planetPhaseOffsets = {}

function orbitGeometry(system) {
  const systemNode = findNode(`system-${system.slug}`)
  if (!systemNode) return null
  const size = systemNode.style?.width ? parseFloat(systemNode.style.width) : 400
  const starVisualR = Math.floor(Math.max(0.1, systemNode.data?.starSize ?? 1) * 64) / 2
  const innerR = Math.round(starVisualR) + 20
  const allMembers = system.members ?? system.planets ?? []
  const autoOuterR = innerR + Math.max(80, allMembers.length * 55)
  const outerR = size / 2 - 40
  const cx = systemNode.position.x + size / 2
  const cy = systemNode.position.y + size / 2
  return { innerR, autoOuterR, outerR, cx, cy, allMembers }
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
      const { innerR, autoOuterR, cx, cy, allMembers } = geo
      if (allMembers.length === 0) continue

      const autoOrbitRadii = computeOrbitRadii(allMembers, innerR, autoOuterR)

      allMembers.forEach((member, i) => {
        const slug = typeof member === 'string' ? member : member.slug
        const type = typeof member === 'string' ? 'planet' : member.type
        if (type !== 'planet') return
        if (typeof member === 'object' && member.lagrange_point) return  // fixed at Lagrange point
        const planet = planets.value.find(p => p.slug === slug)
        if (!planet) return
        const baseline = planet.orbit_distance ?? autoOrbitRadii[i]
        const preview = orbitEventPreview.value
        const orbitR = (preview && preview.orbit && preview.planetSlug === slug)
          ? (preview.showAfter ? preview.orbit.after : (preview.orbit.before ?? baseline))
          : resolveOrbitDistance(planet.orbit_events ?? [], baseline, timelineEvents.value, nowYear.value)
        const gravity = planet.gravity_multiplier ?? 1
        const ω = SPEED * gravity / Math.pow(orbitR, 1.5)
        if (!(slug in planetPhaseOffsets)) planetPhaseOffsets[slug] = Math.random() * 2 * Math.PI
        const angle = planetPhaseOffsets[slug] + ω * t
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
      const geo = orbitGeometry(system)
      if (!geo) continue
      const { innerR, autoOuterR, cx, cy, allMembers } = geo

      // A system is binary if it has a star-type member; also used as the
      // Lagrange co-rotation reference below.
      const starMemberIdx = allMembers.findIndex(m => typeof m === 'object' && m.type === 'star')
      if (starMemberIdx === -1) continue
      let secondaryAngle = -Math.PI / 2

      // Animate each star-type member as a secondary star node
      allMembers.forEach((member, mi) => {
        if (typeof member !== 'object' || member.type !== 'star') return
        const nodeId = `secondary-${system.slug}-${mi}`
        const ssNode = findNode(nodeId)
        if (!ssNode) return
        const orbitR = member.orbit_distance ?? innerR + 0.65 * (autoOuterR - innerR)
        const ω = SPEED * 0.3 / Math.pow(orbitR, 1.5)
        if (!(nodeId in planetPhaseOffsets)) planetPhaseOffsets[nodeId] = Math.random() * 2 * Math.PI
        const a = planetPhaseOffsets[nodeId] + ω * t
        if (mi === starMemberIdx) secondaryAngle = a
        const ssR = (ssNode.data?.size ?? 8) / 2
        updateNode(nodeId, {
          position: {
            x: cx + orbitR * Math.cos(a) - ssR,
            y: cy + orbitR * Math.sin(a) - ssR,
          },
        })
      })

      // Co-rotate Lagrange planets with first secondary star
      allMembers.forEach(member => {
        if (typeof member !== 'object' || !member.lagrange_point) return
        const planet = planets.value.find(p => p.slug === member.slug)
        if (!planet) return
        const starMember = allMembers[starMemberIdx]
        const secOrbitR = (typeof starMember === 'object' ? starMember.orbit_distance : null) ?? innerR + 0.65 * (autoOuterR - innerR)
        const lp = lagrangePos(member.lagrange_point, secOrbitR, secondaryAngle)
        const lagrangeR = planet.orbit_distance ?? lp.r
        if (planet.polar_orbit_moons?.length) polarOrbitAngles[member.slug] = lp.a + Math.PI / 2
        const pSize = Math.floor(Math.max(0.1, planet.size_multiplier ?? 1) * 64)
        updateNode(member.slug, {
          position: {
            x: cx + lagrangeR * Math.cos(lp.a) - pSize / 2,
            y: cy + lagrangeR * Math.sin(lp.a) - pSize / 2,
          },
        })
      })
    }

    // Moon animation
    const allNodes = getNodes.value
    for (const node of allNodes) {
      if (node.type !== 'moon') continue
      const { parentSlug, index, count, planetSize, phaseOffset, isPolarOrbit, orbitType, orbitRotation, manualOrbitR } = node.data
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
        const θ = baseAngle + ω * t
        let x, y
        if (orbitType === 'eccentric-a') {
          const rot = orbitRotation ?? 0
          const lx = orbitR * Math.cos(θ)
          const ly = orbitR * 0.45 * Math.sin(θ)
          x = pCX + lx * Math.cos(rot) - ly * Math.sin(rot) - 2.5
          y = pCY + lx * Math.sin(rot) + ly * Math.cos(rot) - 2.5
        } else if (orbitType === 'eccentric-c') {
          const rot = orbitRotation ?? 0
          x = pCX + orbitR * 0.4 * Math.cos(rot) + orbitR * Math.cos(θ) - 2.5
          y = pCY + orbitR * 0.4 * Math.sin(rot) + orbitR * Math.sin(θ) - 2.5
        } else {
          x = pCX + orbitR * Math.cos(θ) - 2.5
          y = pCY + orbitR * Math.sin(θ) - 2.5
        }
        updateNode(node.id, { position: { x, y } })
      }
    }

    // Anomaly orbital animation
    for (const node of allNodes) {
      if (node.type !== 'anomaly') continue
      const { systemSlug, orbitDist, size } = node.data
      if (!orbitDist) continue
      const systemNode = findNode(`system-${systemSlug}`)
      if (!systemNode) continue
      const sysSize = parseFloat(systemNode.style?.width) || 400
      const cx = systemNode.position.x + sysSize / 2
      const cy = systemNode.position.y + sysSize / 2
      const ω = SPEED * 0.4 / Math.pow(orbitDist, 1.5)
      if (!(node.id in planetPhaseOffsets)) planetPhaseOffsets[node.id] = Math.random() * 2 * Math.PI
      const a = planetPhaseOffsets[node.id] + ω * t
      updateNode(node.id, {
        position: {
          x: cx + orbitDist * Math.cos(a) - (size ?? 60) / 2,
          y: cy + orbitDist * Math.sin(a) - (size ?? 60) / 2,
        }
      })
    }
  }
  animFrame = requestAnimationFrame(animate)
}

function startAnimation() {
  if (!animFrame) animFrame = requestAnimationFrame(animate)
}
function stopAnimation() {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null }
}
function onVisibilityChange() {
  document.hidden ? stopAnimation() : startAnimation()
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  startAnimation()
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  stopAnimation()
})
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
  if (node.type === 'anomaly') {
    const parts = node.id.split('-')
    const memberIndex = parseInt(parts[parts.length - 1], 10)
    const systemSlug = parts.slice(1, -1).join('-')
    selectedSystemSlug.value = systemSlug
    selectedPlanetSlug.value = null
    selectedBodyMemberIndex.value = memberIndex
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
