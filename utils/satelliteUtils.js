export function getSatelliteType(planet, moonName) {
  return (planet.satellite_types ?? {})[moonName] ?? 'moon'
}

export function getMoonOrbitType(planet, moonName) {
  const types = planet.moon_orbit_types ?? {}
  if (types[moonName]) return types[moonName]
  if ((planet.polar_orbit_moons ?? []).includes(moonName)) return 'polar'
  return 'standard'
}
