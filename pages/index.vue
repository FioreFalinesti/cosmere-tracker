<template>
  <div class="relative h-full">
    <VueFlow
      :nodes-connectable="false"
      :edges-updatable="false"
      :min-zoom="0.01"
      :max-zoom="10"
      class="cosmere-map"
    >
      <MapSync :nodes="visibleNodes" :edit-positions="editPositions" />
      <Background
        variant="dots"
        :gap="40"
        :size="1.2"
        pattern-color="#1e3a6e"
        bg-color="#000000"
      />
      <template #node-planet="nodeProps">
        <PlanetNode v-bind="nodeProps" />
      </template>
      <template #node-system="nodeProps">
        <SystemNode v-bind="nodeProps" />
      </template>
      <template #node-moon="nodeProps">
        <MoonNode v-bind="nodeProps" />
      </template>
      <template #node-secondary-star="nodeProps">
        <SecondaryStarNode v-bind="nodeProps" />
      </template>
      <template #node-anomaly="nodeProps">
        <AnomalyNode v-bind="nodeProps" />
      </template>

      <div v-if="visibleNodes.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p class="text-indigo-700 text-sm">Enable planets in the sidebar to populate the map.</p>
      </div>
    </VueFlow>

    <InfoPanel />
  </div>
</template>

<script setup>
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { averageHexColors } from '~/utils/colorUtils'
import { resolveOrbitDistance, resolveExists, resolveLocation, resolveStatus, TERMINAL_SHARD_STATUSES } from '~/utils/orbitUtils'
import { getMoonOrbitType, getSatelliteType } from '~/utils/satelliteUtils'

definePageMeta({ layout: 'map' })

const { books, load } = useCosmere()
const { planets, init: initPlanets, nodeData, computeOrbitRadii } = usePlanetSettings()
const { systems, init: initSystems } = useSystemSettings()
const { entities, init: initEntities } = useEntitySettings()
const { editPositions, selectedPlanetSlug, selectedSystemSlug, selectedBodyMemberIndex, zoomTarget, orbitEventPreview } = useMapState()
const { init: initEvents, currentEvent } = useTimelineEvents()

await load()
await initPlanets()
await initSystems()
await initEntities()
await initEvents()

// Shift camera focus to wherever the timeline scrubber currently points —
// an event's system/planet link now drives "where are we looking", not
// visibility. Events with neither field leave the camera untouched. An event
// with both links defaults to focusing the specific planet, but can opt into
// framing the whole system instead via zoom_scope (e.g. "arrives in the
// system" reads better zoomed out than snapped to one planet in it).
watch(currentEvent, ev => {
  if (!ev) return
  if (ev.zoom_scope === 'system' && ev.system_slug) zoomTarget.value = { type: 'system', slug: ev.system_slug }
  else if (ev.planet_slug) zoomTarget.value = { type: 'planet', slug: ev.planet_slug }
  else if (ev.system_slug) zoomTarget.value = { type: 'system', slug: ev.system_slug }
}, { immediate: true })

function planetSize(p) {
  return Math.floor(Math.max(0.1, p.size_multiplier ?? 1) * 64)
}

// Most systems/planets are pre-existing astronomical fixtures and are shown
// unconditionally (exists_from_start defaults true when absent — no
// migration needed). A body only needs gating if it's explicitly marked
// exists_from_start:false, in which case it stays hidden until a revealed
// existence_events/orbit_events entry flips it to exists_after:true.
function isVisible(entity, eventsField) {
  const baseline = entity.exists_from_start !== false
  return resolveExists(entity[eventsField] ?? [], baseline)
}

// Shards and splinter-remnants (e.g. the Dor) currently located at a given
// system/planet slug — one that's splintered, destroyed, or combined into a
// new fused Shard drops off the map entirely rather than lingering at its
// last known location.
function shardBadgesAt(locationSlug) {
  return entities.value
    .filter(e =>
      (e.type === 'shard' || e.type === 'splinter-remnant') &&
      resolveLocation(e.location_events ?? [], e.location_slug) === locationSlug &&
      !TERMINAL_SHARD_STATUSES.includes(resolveStatus(e.status_events ?? [], e.status))
    )
    .map(e => ({
      slug: e.slug,
      name: e.name,
      color: e.color ?? '#bb88ff',
      kind: e.type === 'splinter-remnant' ? 'remnant' : 'shard',
    }))
}

// Vue Flow requires parent nodes to appear before their children
const visibleNodes = computed(() => {
  const systemNodes = []
  const planetNodes = []

  for (const system of systems.value) {
    const planetSlugs = (system.members ?? system.planets ?? []).filter(m => typeof m === 'string' ? true : m.type === 'planet').map(m => typeof m === 'string' ? m : m.slug)
    const allMembers = planetSlugs.map(slug => planets.value.find(p => p.slug === slug)).filter(Boolean)
    if (allMembers.length === 0 || !isVisible(system, 'existence_events')) continue

    const inhabitedMembers = allMembers.filter(p => p.uninhabited !== true)
    const color = averageHexColors((inhabitedMembers.length ? inhabitedMembers : allMembers).map(p => p.color))

    const systemMemberList = system.members ?? system.planets ?? []

    // innerR based purely on star visual size — no dependency on system size
    const starVisualR = Math.floor(Math.max(0.1, system.star_size ?? 1) * 64) / 2
    const innerR = Math.round(starVisualR) + 20

    // autoOuterR: default orbit range for auto-spaced members
    const autoOuterR = innerR + Math.max(80, systemMemberList.length * 55)

    // Collect max manual orbit distance across all members
    let maxManualDist = 0
    systemMemberList.forEach(member => {
      const mType = typeof member === 'string' ? 'planet' : member.type
      if (mType !== 'planet') {
        if (typeof member === 'object' && member.orbit_distance != null)
          maxManualDist = Math.max(maxManualDist, member.orbit_distance)
      } else {
        const mSlug = typeof member === 'string' ? member : member.slug
        const planet = planets.value.find(p => p.slug === mSlug)
        if (planet?.orbit_distance != null)
          maxManualDist = Math.max(maxManualDist, planet.orbit_distance)
      }
    })

    const outerR = Math.max(autoOuterR, maxManualDist > 0 ? maxManualDist + 50 : 0)
    const size = Math.ceil(outerR + 40) * 2

    const n = systemMemberList.length || allMembers.length
    const sysCX = system.map_x + size / 2
    const sysCY = system.map_y + size / 2
    const angle = -Math.PI / 2  // 12 o'clock

    // Binary star support — derived from star-type members
    const starMemberIdx = systemMemberList.findIndex(m => typeof m === 'object' && m.type === 'star')
    const isBinary = starMemberIdx !== -1
    // secondaryOrbitR resolved after memberOrbitDistances is computed (see below)
    let secondaryOrbitR = 0
    function getLagrangePos(lp) {
      switch (lp) {
        case 1: return { r: secondaryOrbitR * 0.78, a: angle }
        case 2: return { r: secondaryOrbitR * 1.18, a: angle }
        case 3: return { r: secondaryOrbitR, a: angle + Math.PI }
        case 4: return { r: secondaryOrbitR, a: angle - Math.PI / 3 }
        case 5: return { r: secondaryOrbitR, a: angle + Math.PI / 3 }
        default: return { r: secondaryOrbitR, a: angle }
      }
    }
    const memberLagrangePoints = systemMemberList.map(m =>
      typeof m === 'object' ? (m.lagrange_point ?? null) : null
    )

    // Exclude Lagrange members from orbit spacing; reconstruct full radius array
    const nonLagrangeMembers = isBinary
      ? systemMemberList.filter((_, i) => !memberLagrangePoints[i])
      : systemMemberList
    const nonLagrangeRadii = computeOrbitRadii(nonLagrangeMembers, innerR, autoOuterR)
    let nlIdx = 0
    const autoOrbitRadii = systemMemberList.map((m, i) => {
      if (isBinary && memberLagrangePoints[i]) return getLagrangePos(memberLagrangePoints[i]).r
      const r = nonLagrangeRadii[nlIdx] ?? innerR + (autoOuterR - innerR) / 2
      nlIdx++
      return r
    })

    // Resolve final orbit distance for each member (manual overrides auto)
    const memberOrbitDistances = autoOrbitRadii.map((defaultR, i) => {
      const member = systemMemberList[i]
      const mType = typeof member === 'string' ? 'planet' : member.type
      const mSlug = typeof member === 'string' ? member : member.slug
      if (mType !== 'planet' || memberLagrangePoints[i]) {
        if (typeof member === 'object' && member.orbit_distance != null) return member.orbit_distance
        return defaultR
      }
      const planet = planets.value.find(p => p.slug === mSlug)
      const baseline = planet?.orbit_distance ?? defaultR
      const preview = orbitEventPreview.value
      if (preview && preview.orbit && preview.planetSlug === mSlug) {
        return preview.showAfter ? preview.orbit.after : (preview.orbit.before ?? baseline)
      }
      return resolveOrbitDistance(planet?.orbit_events ?? [], baseline)
    })

    if (isBinary) secondaryOrbitR = memberOrbitDistances[starMemberIdx] ?? innerR + 0.65 * (autoOuterR - innerR)

    // Only planet-type members can be hidden pre-existence — other member
    // types (stars, belts, anomalies) have no exists_from_start/orbit_events
    // gating of their own, so they're always considered visible here.
    const memberVisible = systemMemberList.map((member, i) => {
      const mType = typeof member === 'string' ? 'planet' : member.type
      if (mType !== 'planet') return true
      const mSlug = typeof member === 'string' ? member : member.slug
      const planet = planets.value.find(p => p.slug === mSlug)
      return planet ? isVisible(planet, 'orbit_events') : false
    })

    systemNodes.push({
      id: `system-${system.slug}`,
      type: 'system',
      position: { x: system.map_x, y: system.map_y },
      draggable: editPositions.value,
      style: { width: `${size}px`, height: `${size}px`, zIndex: -1 },
      data: {
        name: system.name,
        starName: system.star_name ?? null,
        starColor: system.star_color ?? '#ffcc44',
        starSize: system.star_size ?? 1,
        starParticulateRing: system.star_particulate_ring ?? false,
        isBinary,
        secondaryStarOrbitDist: isBinary ? memberOrbitDistances[starMemberIdx] ?? 0 : 0,
        secondaryStarColor: isBinary ? (systemMemberList[starMemberIdx]?.color ?? '#ff8844') : '#ff8844',
        color,
        size,
        slug: system.slug,
        planetCount: allMembers.length,
        memberTypes: systemMemberList.map(m => typeof m === 'string' ? 'planet' : m.type),
        memberOrbitDistances,
        memberLagrangePoints,
        memberVisible,
        shardsHere: shardBadgesAt(system.slug),
      },
    })

    // Secondary star nodes — one per star-type member
    systemMemberList.forEach((member, i) => {
      if (typeof member !== 'object' || member.type !== 'star') return
      const starColor = member.color ?? '#ff8844'
      const sizeMultiplier = member.size ?? 0.5
      const ssRadius = Math.max(3, Math.round(starVisualR * sizeMultiplier))
      const orbitR = memberOrbitDistances[i]
      planetNodes.push({
        id: `secondary-${system.slug}-${i}`,
        type: 'secondary-star',
        draggable: false,
        position: {
          x: sysCX + orbitR * Math.cos(angle) - ssRadius,
          y: sysCY + orbitR * Math.sin(angle) - ssRadius,
        },
        data: {
          color: starColor,
          size: ssRadius * 2,
          particulateRing: member.particulate_ring ?? false,
          systemSlug: system.slug,
          memberIndex: i,
        },
      })
    })

    // For each member, collect ALL possible orbit radii (default + every orbit_event
    // override). Lagrange members use only their fixed radius (no event overrides).
    const allPossibleOrbitR = systemMemberList.map((member, i) => {
      const type = typeof member === 'string' ? 'planet' : member.type
      const slug = typeof member === 'string' ? member : member.slug
      const defaultR = autoOrbitRadii[i]
      if (type !== 'planet') return [memberOrbitDistances[i]]
      if (memberLagrangePoints[i]) return [memberOrbitDistances[i]]
      const planet = planets.value.find(p => p.slug === slug)
      const baseR = planet?.orbit_distance ?? defaultR
      const eventRs = (planet?.orbit_events ?? []).map(ev =>
        ev.orbit_after ?? baseR
      )
      return [baseR, ...eventRs]
    })

    // Build ordered planet-orbit list (Lagrange planets excluded from gap calc)
    const planetOrbitList = []
    const memberToPlanetIdx = new Map()
    systemMemberList.forEach((member, i) => {
      const type = typeof member === 'string' ? 'planet' : member.type
      if (type !== 'planet') return
      if (memberLagrangePoints[i]) return
      memberToPlanetIdx.set(i, planetOrbitList.length)
      planetOrbitList.push(allPossibleOrbitR[i])
    })

    systemMemberList.forEach((member, i) => {
      const memberType = typeof member === 'string' ? 'planet' : member.type
      const slug = typeof member === 'string' ? member : member.slug
      if (memberType === 'anomaly') {
        const orbitR = memberOrbitDistances[i]
        const anomalySize = member.size ?? 60
        planetNodes.push({
          id: `anomaly-${system.slug}-${i}`,
          type: 'anomaly',
          draggable: false,
          position: {
            x: sysCX + orbitR * Math.cos(angle) - anomalySize / 2,
            y: sysCY + orbitR * Math.sin(angle) - anomalySize / 2,
          },
          data: { size: anomalySize, color: member.color ?? '#bb88ff', systemSlug: system.slug, orbitDist: orbitR },
        })
        return
      }
      if (memberType !== 'planet') return
      const planet = planets.value.find(p => p.slug === slug)
      if (!planet) return
      if (!isVisible(planet, 'orbit_events')) return
      const pSize = planetSize(planet)
      const lagrangePoint = memberLagrangePoints[i]

      let orbitR, posAngle, maxMoonOrbitR

      if (isBinary && lagrangePoint) {
        // Lagrange planet: co-rotates with secondary; radius overridable via orbit_distance
        const lp = getLagrangePos(lagrangePoint)
        orbitR = planet.orbit_distance ?? lp.r
        posAngle = lp.a
        maxMoonOrbitR = Infinity
      } else {
        // Normal planet: standard orbit with gap-based moon spacing
        orbitR = memberOrbitDistances[i]
        posAngle = angle
        const pi = memberToPlanetIdx.get(i)
        const myRs = planetOrbitList[pi]
        const innerRs = pi > 0 ? planetOrbitList[pi - 1] : null
        const outerRs = pi < planetOrbitList.length - 1 ? planetOrbitList[pi + 1] : null
        const innerGap = innerRs ? Math.max(0, Math.min(...myRs) - Math.max(...innerRs)) : Infinity
        const outerGap = outerRs ? Math.max(0, Math.min(...outerRs) - Math.max(...myRs)) : Infinity
        const halfGap = planetOrbitList.length > 1 ? Math.min(innerGap, outerGap) / 2 : Infinity
        maxMoonOrbitR = halfGap > pSize / 2 ? halfGap : Infinity
      }

      // Compute per-moon orbit data once — used for both the ring display and animation
      const mBaseR = pSize / 2 + 40
      const mCount = (planet.moons ?? []).length
      const mNaturalMax = mBaseR + Math.max(0, mCount - 1) * 24
      const mSpacing = isFinite(maxMoonOrbitR) && mCount > 1 && maxMoonOrbitR < mNaturalMax
        ? (maxMoonOrbitR - mBaseR) / (mCount - 1)
        : 24
      const moonOrbitDistMap = planet.moon_orbit_distances ?? {}
      const satTypeMap = planet.satellite_types ?? {}
      const satThickMap = planet.satellite_thicknesses ?? {}
      const satTiltMap = planet.satellite_tilts ?? {}
      const allSatOrbits = (planet.moons ?? []).map((moonName, mi) => {
        const mDist = moonOrbitDistMap[moonName]
        const isManual = mDist != null
        const orbitR = isManual
          ? Math.max(pSize / 2, mDist)
          : mBaseR + mi * mSpacing
        const orbitType = getMoonOrbitType(planet, moonName)
        const orbitRotation = (mi / Math.max(mCount, 1)) * Math.PI * 2
        const satType = satTypeMap[moonName] ?? 'moon'
        const thickness = satThickMap[moonName] ?? null
        const tilt = satTiltMap[moonName] ?? null
        return { orbitR, isPolarOrbit: orbitType === 'polar', isManual, orbitType, orbitRotation, satType, thickness, tilt }
      })

      const moonOrbits = allSatOrbits.filter(o => o.satType !== 'ring')
      const ringOrbits = allSatOrbits.filter(o => o.satType === 'ring').map(o => ({ orbitR: o.orbitR, thickness: o.thickness, tilt: o.tilt }))

      planetNodes.push({
        id: planet.slug,
        type: 'planet',
        draggable: false,
        position: {
          x: sysCX + orbitR * Math.cos(posAngle) - pSize / 2,
          y: sysCY + orbitR * Math.sin(posAngle) - pSize / 2,
        },
        data: {
          ...nodeData(planet, orbitEventPreview.value),
          systemSlug: system.slug,
          memberIndex: i,
          memberCount: n,
          maxMoonOrbitR,
          moonOrbits,
          ringOrbits,
          shardsHere: shardBadgesAt(planet.slug),
        },
      })

      // Moon nodes — only for non-ring satellites
      const slugSeed = planet.slug.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 10000, 0) / 10000
      moonOrbits.forEach((moonData, mi) => {
        const phaseOffset = (slugSeed + mi * 0.6180339887) % 1
        planetNodes.push({
          id: `moon-${planet.slug}-${mi}`,
          type: 'moon',
          draggable: false,
          position: { x: 0, y: 0 },  // driven by animation loop
          data: { parentSlug: planet.slug, index: mi, count: mCount, planetSize: pSize, phaseOffset, isPolarOrbit: moonData.isPolarOrbit, orbitType: moonData.orbitType, orbitRotation: moonData.orbitRotation, manualOrbitR: moonData.isManual ? moonData.orbitR : null },
        })
      })
    })
  }

  return [...systemNodes, ...planetNodes]
})
</script>

<style>
.cosmere-map .vue-flow__edge-path { stroke-opacity: 0.6; }
.cosmere-map .vue-flow__handle { display: none; }
.cosmere-map .vue-flow__node { background: transparent; border: none; padding: 0; }
.cosmere-map .vue-flow__node.selected > div { outline: none; }
.cosmere-map .vue-flow__node { cursor: pointer; }
</style>
