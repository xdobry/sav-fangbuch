<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Bait, CatchEntry, CatchForm, FishSpecies, FishingSession, Montage, Rod, Water } from '../types'

const props = withDefaults(defineProps<{
  waters: Water[]
  species: FishSpecies[]
  rods: Rod[]
  baits: Bait[]
  montages: Montage[]
  catches: CatchEntry[]
  session: FishingSession
  editingCatchId: string | null
  showCatchList?: boolean
  showCancel?: boolean
  autoLocate?: boolean
}>(), {
  showCatchList: true,
  showCancel: false,
  autoLocate: true
})
const form = defineModel<CatchForm>({ required: true })
const isGettingPosition = ref(false)
const positionMessage = ref('')
const positionError = ref('')
let positionRequest = 0
const emit = defineEmits<{
  submit: []
  edit: [catchId: string]
  delete: [catchId: string]
  cancelEdit: []
}>()

const coordinateError = computed(() => {
  const { latitude, longitude } = form.value
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
const openStreetMapUrl = computed(() => {
  const { latitude, longitude } = form.value
  if (latitude === undefined || longitude === undefined || coordinateError.value) return ''
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
})

const setCoordinate = (coordinate: 'latitude' | 'longitude', event: Event) => {
  positionRequest++
  isGettingPosition.value = false
  const input = event.target as HTMLInputElement
  form.value[coordinate] = input.value === '' ? undefined : input.valueAsNumber
  positionMessage.value = ''
  positionError.value = ''
}

const getCurrentPosition = (automatic = false) => {
  const request = ++positionRequest
  positionMessage.value = ''
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
      if (request !== positionRequest || (automatic && !props.autoLocate)) return
      form.value.latitude = position.coords.latitude
      form.value.longitude = position.coords.longitude
      isGettingPosition.value = false
      positionMessage.value = 'Aktuelle Position übernommen.'
    },
    (error) => {
      if (request !== positionRequest || (automatic && !props.autoLocate)) return
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

const submitCatch = () => {
  if (coordinateError.value) return
  emit('submit')
}

watch([() => props.autoLocate, () => props.editingCatchId, () => form.value], () => {
  positionRequest++
  isGettingPosition.value = false
  positionMessage.value = ''
  positionError.value = ''
}, { flush: 'sync' })

onMounted(() => {
  if (props.autoLocate && !props.editingCatchId) getCurrentPosition(true)
})

onUnmounted(() => { positionRequest++ })
</script>

<template>
  <div class="box">
    <h2 class="subtitle is-6">
      {{ editingCatchId ? 'Fischfang bearbeiten' : 'Fischfang für diese Tour erfassen' }}
    </h2>
    <p class="mb-4">
      Gewässer: {{ waters.find((water) => water.id === session.waterId)?.name ?? 'Unbekannt' }}
    </p>
    <div class="columns is-multiline">
      <div class="column is-half">
        <label class="label">Zeit</label>
        <input v-model="form.time" type="datetime-local" class="input" />
      </div>
      <div class="column is-half">
        <label class="label">Fischart</label>
        <div class="select is-fullwidth">
          <select v-model="form.speciesId">
            <option v-for="fish in species" :key="fish.id" :value="fish.id">{{ fish.name }}</option>
          </select>
        </div>
      </div>
      <div class="column is-half">
        <label class="label">Angelrute</label>
        <div class="select is-fullwidth">
          <select v-model="form.rodId">
            <option v-for="rod in rods" :key="rod.id" :value="rod.id">{{ rod.type }} {{ rod.length }} m</option>
          </select>
        </div>
      </div>
      <div class="column is-one-third">
        <label class="label">Länge in cm</label>
        <input v-model="form.lengthCm" type="number" min="0" class="input" />
      </div>
      <div class="column is-one-third">
        <label class="label">Gewicht in kg</label>
        <input v-model="form.weightKg" type="number" min="0" step="0.1" class="input" />
      </div>
      <div class="column is-one-third">
        <label class="label">Köder</label>
        <div class="select is-fullwidth">
          <select v-model="form.baitId">
            <option v-for="bait in baits" :key="bait.id" :value="bait.id">{{ bait.name }} ({{ bait.kind }})</option>
          </select>
        </div>
      </div>
      <div class="column is-one-third">
        <label class="label">Montage</label>
        <div class="select is-fullwidth">
          <select v-model="form.montageId">
            <option v-for="montage in montages" :key="montage.id" :value="montage.id">
              {{ montage.title }}
            </option>
          </select>
        </div>
      </div>
      <div class="column is-one-third">
        <label class="label">Montagegewicht</label>
        <input v-model.number="form.montageWeight" type="number" min="0" step="any" class="input" />
      </div>
      <div class="column is-full">
        <label class="checkbox">
          <input v-model="form.retained" type="checkbox" />
          Fisch wurde entnommen
        </label>
      </div>
      <div class="column is-full">
        <label class="label">GPS-Position</label>
        <div class="columns is-mobile">
          <div class="column">
            <label class="label" for="catch-latitude">Breitengrad</label>
            <input
              id="catch-latitude"
              :value="form.latitude ?? ''"
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
            <label class="label" for="catch-longitude">Längengrad</label>
            <input
              id="catch-longitude"
              :value="form.longitude ?? ''"
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
        <div class="buttons">
          <button class="button is-light" type="button" :disabled="isGettingPosition" @click="getCurrentPosition()">
            <span aria-hidden="true">◎</span>&nbsp;
            {{ isGettingPosition ? 'Position wird ermittelt …' : 'Aktuelle Position' }}
          </button>
          <a
            v-if="openStreetMapUrl"
            class="button is-light"
            :href="openStreetMapUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap öffnen
          </a>
        </div>
        <p v-if="positionMessage" class="help is-success" role="status">{{ positionMessage }}</p>
        <p v-if="positionError" class="help is-danger" role="alert">{{ positionError }}</p>
        <p v-if="coordinateError" class="help is-danger" role="alert">{{ coordinateError }}</p>
      </div>
      <div class="column is-full">
        <label class="label">Foto</label>
        <input v-model="form.photo" type="text" class="input" placeholder="optional URL oder datei" />
      </div>
      <div class="column is-full">
        <label class="label">Notiz</label>
        <textarea v-model="form.notes" class="textarea" rows="3" placeholder="Notizen zum Fang..." />
      </div>
    </div>
    <div class="buttons mt-3">
      <button class="button is-link" @click="submitCatch">
        {{ editingCatchId ? 'Änderungen speichern' : 'Fang speichern' }}
      </button>
      <button
        v-if="editingCatchId || props.showCancel"
        class="button"
        type="button"
        @click="$emit('cancelEdit')"
      >
        Abbrechen
      </button>
    </div>
  </div>

  <div v-if="props.showCatchList" class="box">
    <h2 class="subtitle is-6">Erfasste Fänge</h2>
    <div v-if="catches.length === 0" class="has-text-grey">Noch keine Fänge erfasst.</div>
    <div v-else class="content">
      <div v-for="entry in catches" :key="entry.id" class="catch-row">
        <span>
          {{ species.find((fish) => fish.id === entry.speciesId)?.name }} ·
          {{ entry.time }} · {{ entry.lengthCm }} cm
          <span v-if="entry.weightKg">· {{ entry.weightKg }} kg</span>
          · {{ entry.retained ? 'Entnommen' : 'Nicht entnommen' }}
          <span v-if="entry.latitude !== undefined && entry.longitude !== undefined">
            · {{ entry.latitude.toFixed(6) }}, {{ entry.longitude.toFixed(6) }}
          </span>
        </span>
        <div class="buttons are-small">
          <button class="button is-light" @click="$emit('edit', entry.id)">Bearbeiten</button>
          <button class="button is-danger is-light" @click="$emit('delete', entry.id)">Löschen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.catch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}
</style>
