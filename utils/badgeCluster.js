// Clusters badges (e.g. Shard location markers) evenly around a point,
// growing the cluster radius with both the anchor body's own size and the
// badge count — otherwise a heavily-populated body crams every badge into
// the same tiny ring and they overlap. `sizeBasis` is the radius the cluster
// scales off of — a star's visual radius for a system (badges cluster over
// the star, not the whole system circle), a planet's own radius for a planet.
export function clusterBadgePositions(items, center, sizeBasis, { minRadius, sizeFactor, perItemRadius }) {
  const n = items.length
  if (n === 0) return []
  const clusterRadius = n > 1 ? Math.max(minRadius, sizeBasis * sizeFactor, n * perItemRadius) : 0
  return items.map((item, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    return {
      ...item,
      x: center + clusterRadius * Math.cos(angle),
      y: center + clusterRadius * Math.sin(angle),
    }
  })
}
