<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { createId } from '../utils/createId'
import type { FishingSession, Water, WaterForm } from '../types'

const props = defineProps<{
  sessions: FishingSession[]
}>()
const waters = defineModel<Water[]>('waters', { required: true })
const emit = defineEmits<{
  save: []
}>()
const waterForm = ref<WaterForm>({ name: '', location: '' })
const editingWaterId = ref<string | null>(null)
const waterMessage = ref('')
const isGettingPosition = ref(false)
const positionError = ref('')

const coordinateError = computed(() => {
  const { latitude, longitude } = waterForm.value
  if ((latitude === undefined) !== (longitude === undefined)) {
    return 'Bitte Breiten- und Längengrad gemeinsam eingeben.'
  }
  if (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    return 'Der Breitengrad muss zwischen -90 und 90 liegen.'
  }
  if (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    return 'Der Längengrad muss zwischen -180 und 180 liegen.'
  }
  return ''
})

const isFormValid = computed(() =>
  Boolean(waterForm.value.name.trim() && waterForm.value.location.trim()) && !coordinateError.value
)

const setCoordinate = (coordinate: 'latitude' | 'longitude', event: Event) => {
  const input = event.target as HTMLInputElement
  waterForm.value[coordinate] = input.value === '' ? undefined : input.valueAsNumber
  positionError.value = ''
}

const getCurrentPosition = () => {
  positionError.value = ''
  if (!window.isSecureContext) {
    positionError.value = 'Die Standortbestimmung ist nur über HTTPS oder localhost verfügbar.'
    return
  }
  if (!navigator.geolocation) {
    positionError.value = 'Dieser Browser unterstützt keine Standortbestimmung.'
    return
  }

  isGettingPosition.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      waterForm.value.latitude = position.coords.latitude
      waterForm.value.longitude = position.coords.longitude
      isGettingPosition.value = false
    },
    (error) => {
      isGettingPosition.value = false
      if (error.code === error.PERMISSION_DENIED) {
        positionError.value = 'Der Zugriff auf den Standort wurde verweigert. Bitte erteile dem Browser die Berechtigung.'
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        positionError.value = 'Die aktuelle Position ist nicht verfügbar.'
      } else if (error.code === error.TIMEOUT) {
        positionError.value = 'Die Standortbestimmung hat zu lange gedauert. Bitte versuche es erneut.'
      } else {
        positionError.value = 'Die Standortbestimmung ist fehlgeschlagen.'
      }
    },
    { enableHighAccuracy: true, timeout: 15000 }
  )
}

const openStreetMapUrl = (water: Water) => {
  if (water.latitude === undefined || water.longitude === undefined) return ''
  return `https://www.openstreetmap.org/?mlat=${water.latitude}&mlon=${water.longitude}#map=16/${water.latitude}/${water.longitude}`
}

const cancelWaterEdit = () => {
  editingWaterId.value = null
  waterForm.value = { name: '', location: '' }
  waterMessage.value = ''
}

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

const saveWater = () => {
  if (!isFormValid.value) return

  const waterData = {
    name: waterForm.value.name.trim(),
    location: waterForm.value.location.trim(),
    latitude: waterForm.value.latitude,
    longitude: waterForm.value.longitude
  }
  if (editingWaterId.value) {
    const index = waters.value.findIndex((water) => water.id === editingWaterId.value)
    if (index < 0) return
    waters.value = waters.value.map((water, waterIndex) =>
      waterIndex === index ? { ...water, ...waterData } : water
    )
  } else {
    waters.value = [{ id: createId(), ...waterData }, ...waters.value]
  }
  cancelWaterEdit()
  emit('save')
}

const deleteWater = (waterId: string) => {
  const water = waters.value.find((entry) => entry.id === waterId)
  if (!water) return
  if (props.sessions.some((session) => session.waterId === waterId)) {
    waterMessage.value = 'Dieses Gewässer kann nicht gelöscht werden, da Touren darauf verweisen.'
    return
  }
  if (!window.confirm(`Gewässer „${water.name}“ wirklich löschen?`)) return

  waters.value = waters.value.filter((entry) => entry.id !== waterId)
  if (editingWaterId.value === waterId) cancelWaterEdit()
  waterMessage.value = ''
  emit('save')
}

watch(editingWaterId, () => {
  positionError.value = ''
})
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title is-4">Gewässer</h1>
      <div class="box">
        <h2 class="subtitle is-6">{{ editingWaterId ? 'Gewässer bearbeiten' : 'Gewässer erfassen' }}</h2>
        <div class="field">
          <label class="label">Name</label>
          <div class="control"><input v-model="waterForm.name" class="input" placeholder="z. B. Baggersee" /></div>
        </div>
        <div class="field">
          <label class="label">Standort</label>
          <div class="control"><input v-model="waterForm.location" class="input" placeholder="z. B. München" /></div>
        </div>
        <div class="field">
          <label class="label">GPS-Position (optional)</label>
          <div class="columns is-mobile">
            <div class="column">
              <label class="label" for="water-latitude">Breitengrad</label>
              <input
                id="water-latitude"
                :value="waterForm.latitude ?? ''"
                type="number"
                min="-90"
                max="90"
                step="any"
                class="input"
                placeholder="z. B. 51.045"
                @input="setCoordinate('latitude', $event)"
              />
            </div>
            <div class="column">
              <label class="label" for="water-longitude">Längengrad</label>
              <input
                id="water-longitude"
                :value="waterForm.longitude ?? ''"
                type="number"
                min="-180"
                max="180"
                step="any"
                class="input"
                placeholder="z. B. 7.020"
                @input="setCoordinate('longitude', $event)"
              />
            </div>
          </div>
          <button class="button is-light" type="button" :disabled="isGettingPosition" @click="getCurrentPosition">
            <span aria-hidden="true">◎</span>&nbsp;
            {{ isGettingPosition ? 'Position wird ermittelt …' : 'Aktuelle Position' }}
          </button>
          <p v-if="positionError" class="help is-danger" role="alert">{{ positionError }}</p>
          <p v-if="coordinateError" class="help is-danger" role="alert">{{ coordinateError }}</p>
        </div>
        <p v-if="waterMessage" class="notification is-warning is-light" role="alert">{{ waterMessage }}</p>
        <div class="buttons">
          <button class="button is-primary" :disabled="!isFormValid" @click="saveWater">
            {{ editingWaterId ? 'Änderungen speichern' : 'Gewässer speichern' }}
          </button>
          <button v-if="editingWaterId" class="button" type="button" @click="cancelWaterEdit">Abbrechen</button>
        </div>
      </div>

      <div class="box">
        <h2 class="subtitle is-6">Vorhandene Gewässer</h2>
        <div v-if="waters.length === 0" class="has-text-grey">Keine Gewässer vorhanden.</div>
        <table v-else class="table is-fullwidth is-narrow">
          <thead><tr><th>Name</th><th>Standort</th><th>GPS</th><th>Aktionen</th></tr></thead>
          <tbody>
            <tr v-for="water in waters" :key="water.id">
              <td>{{ water.name }}</td>
              <td>{{ water.location || '–' }}</td>
              <td>
                <a
                  v-if="openStreetMapUrl(water)"
                  :href="openStreetMapUrl(water)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ water.latitude?.toFixed(5) }}, {{ water.longitude?.toFixed(5) }}
                </a>
                <span v-else>–</span>
              </td>
              <td>
                <div class="buttons are-small">
                  <button class="button is-light" @click="editWater(water.id)">Bearbeiten</button>
                  <button class="button is-danger is-light" @click="deleteWater(water.id)">Löschen</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
