import { ref } from 'vue'
import { defaultBaits, defaultMontages, defaultRods, defaultWaters } from '../data/defaults'
import { loadStoredData, saveStoredData } from '../services/storage'
import type { FangbuchData } from '../types'

export function useFangbuchData() {
  const data = ref<FangbuchData>({
    waters: defaultWaters.map((water) => ({ ...water })),
    rods: defaultRods.map((rod) => ({ ...rod })),
    baits: defaultBaits.map((bait) => ({ ...bait })),
    montages: defaultMontages.map((montage) => ({ ...montage })),
    sessions: [],
    catches: []
  })

  const applyData = (nextData: FangbuchData) => {
    data.value = nextData
  }

  const saveData = () => saveStoredData(data.value)

  const loadData = () => {
    const loaded = loadStoredData()
    if (!loaded) return false

    applyData(loaded.data)
    if (loaded.needsSave) saveData()
    return true
  }

  return { data, applyData, loadData, saveData }
}