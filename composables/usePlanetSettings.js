function darkenHex(hex, factor = 0.3) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const h = n => Math.round(n * factor).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

const planets = ref([])
const initialized = ref(false)

export function usePlanetSettings() {
  async function init() {
    if (initialized.value) return
    const { client } = useSupabase()
    const { data } = await client.from('planets').select('*').order('name')
    if (data) planets.value = data.map(p => ({ ...p, slug: p.slug?.trim() }))
    initialized.value = true
  }

  function getColor(slug) {
    return planets.value.find(p => p.slug === slug)?.color ?? '#ffffff'
  }

  async function setColor(slug, color) {
    const planet = planets.value.find(p => p.slug === slug)
    if (planet) planet.color = color

    const { client } = useSupabase()
    await client.from('planets').update({ color }).eq('slug', slug)
  }

  function nodeData(planet) {
    const color = planet.color
    return { name: planet.name, color, colorDark: darkenHex(color), size: planet.size }
  }

  return { planets, init, getColor, setColor, nodeData }
}
