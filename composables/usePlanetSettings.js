export const planets = [
  { id: 'sel',      name: 'Sel',      defaultColor: '#4ade80', size: 34, position: { x: 120,  y: 120 } },
  { id: 'scadrial', name: 'Scadrial', defaultColor: '#fb923c', size: 38, position: { x: 200,  y: 460 } },
  { id: 'nalthis',  name: 'Nalthis',  defaultColor: '#f472b6', size: 28, position: { x: 420,  y: 70  } },
  { id: 'taldain',  name: 'Taldain',  defaultColor: '#facc15', size: 26, position: { x: 760,  y: 80  } },
  { id: 'roshar',   name: 'Roshar',   defaultColor: '#22d3ee', size: 42, position: { x: 880,  y: 280 } },
  { id: 'braize',   name: 'Braize',   defaultColor: '#f87171', size: 22, position: { x: 1020, y: 160 } },
  { id: 'ashyn',    name: 'Ashyn',    defaultColor: '#a78bfa', size: 20, position: { x: 1020, y: 380 } },
  { id: 'threnody', name: 'Threnody', defaultColor: '#818cf8', size: 24, position: { x: 80,   y: 340 } },
  { id: 'lumar',    name: 'Lumar',    defaultColor: '#60a5fa', size: 26, position: { x: 640,  y: 520 } },
  { id: 'komashi',  name: 'Komashi',  defaultColor: '#c084fc', size: 24, position: { x: 380,  y: 490 } },
  { id: 'canticle', name: 'Canticle', defaultColor: '#f9a8d4', size: 22, position: { x: 820,  y: 490 } },
]

function darkenHex(hex, factor = 0.3) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const h = n => Math.round(n * factor).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

const overrides = ref({})
const initialized = ref(false)

export function usePlanetSettings() {
  async function init() {
    if (initialized.value) return
    const { client } = useSupabase()
    const { data } = await client.from('user_planet_settings').select('planet_id, color')
    if (data) {
      overrides.value = Object.fromEntries(data.map(r => [r.planet_id, { color: r.color }]))
    }
    initialized.value = true
  }

  function getColor(planetId) {
    return overrides.value[planetId]?.color
      ?? planets.find(p => p.id === planetId)?.defaultColor
      ?? '#ffffff'
  }

  async function setColor(planetId, color) {
    overrides.value = { ...overrides.value, [planetId]: { ...overrides.value[planetId], color } }
    const { client, user } = useSupabase()
    await client.from('user_planet_settings').upsert(
      { user_id: user.value.id, planet_id: planetId, color },
      { onConflict: 'user_id,planet_id' }
    )
  }

  function nodeData(planet) {
    const color = getColor(planet.id)
    return { name: planet.name, color, colorDark: darkenHex(color), size: planet.size }
  }

  return { init, getColor, setColor, nodeData, overrides }
}
