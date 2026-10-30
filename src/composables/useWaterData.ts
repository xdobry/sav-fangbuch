import { ref, type Ref } from 'vue'
import type { Water, WaterForm } from '../types'

export function useWaterData(waters: Ref<Water[]>) {
  const waterForm = ref<WaterForm>({ name: '', location: '' })
  const editingWaterId = ref<string | null>(null)
  const waterMessage = ref('')


  const editWater = (waterId: string) => {
    const water = waters.value.find((entry) => entry.id === waterId)
    if (!water) return

    editingWaterId.value = water.id
    waterForm.value = {
      name: water.name,
      location: water.location,
      latitude: water.latitude,
      longitude: water.longitude
    }
    waterMessage.value = ''
  }

  const cancelWaterEdit = () => {
    editingWaterId.value = null
    waterForm.value = { name: '', location: '' }
    waterMessage.value = ''
  }

  return { waterForm, editingWaterId, waterMessage, editWater, cancelWaterEdit }
}