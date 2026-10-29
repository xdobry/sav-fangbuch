<script setup lang="ts">
import { ref } from 'vue'
import type { FishingSessionForm, Water } from '../types'

const props = defineProps<{ waters: Water[] }>()
const form = defineModel<FishingSessionForm>({ required: true })
defineEmits<{ submit: [] }>()

const isFindingWater = ref(false)
const locationMessage = ref('')
const locationError = ref('')
const isLoadingWeather = ref(false)
const weatherMessage = ref('')
const weatherError = ref('')

type WeatherResponse = {
  hourly?: {
    time?: string[]
    temperature_2m?: (number | null)[]
    cloud_cover?: (number | null)[]
    precipitation?: (number | null)[]
  }
}

const distanceInKm = (latitude: number, longitude: number, water: Water) => {
  if (water.latitude === undefined || water.longitude === undefined) return Infinity

  const radians = Math.PI / 180
  const latitudeDifference = (water.latitude - latitude) * radians
  const longitudeDifference = (water.longitude - longitude) * radians
  const haversine = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(latitude * radians)
    * Math.cos(water.latitude * radians)
    * Math.sin(longitudeDifference / 2) ** 2

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

const findWaterFromPosition = () => {
  locationMessage.value = ''
  locationError.value = ''

  if (!window.isSecureContext) {
    locationError.value = 'Die Standortbestimmung ist nur über HTTPS oder localhost verfügbar.'
    return
  }
  if (!navigator.geolocation) {
    locationError.value = 'Dieser Browser unterstützt keine Standortbestimmung.'
    return
  }

  isFindingWater.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      isFindingWater.value = false
      const nearestWater = props.waters
        .filter((water) =>
          water.latitude !== undefined
          && water.longitude !== undefined
          && Number.isFinite(water.latitude)
          && Number.isFinite(water.longitude)
          && water.latitude >= -90
          && water.latitude <= 90
          && water.longitude >= -180
          && water.longitude <= 180
        )
        .map((water) => ({ water, distance: distanceInKm(coords.latitude, coords.longitude, water) }))
        .sort((first, second) => first.distance - second.distance)[0]

      if (!nearestWater || nearestWater.distance > 3) {
        locationMessage.value = 'Kein Gewässer gefunden'
        return
      }

      form.value.waterId = nearestWater.water.id
      locationMessage.value = `Gewässer „${nearestWater.water.name}“ ausgewählt (${nearestWater.distance.toFixed(1)} km entfernt).`
    },
    (error) => {
      isFindingWater.value = false
      if (error.code === error.PERMISSION_DENIED) {
        locationError.value = 'Der Zugriff auf den Standort wurde verweigert. Bitte erteile dem Browser die Berechtigung.'
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        locationError.value = 'Die aktuelle Position ist nicht verfügbar.'
      } else if (error.code === error.TIMEOUT) {
        locationError.value = 'Die Standortbestimmung hat zu lange gedauert. Bitte versuche es erneut.'
      } else {
        locationError.value = 'Die Standortbestimmung ist fehlgeschlagen.'
      }
    },
    { enableHighAccuracy: true, timeout: 15000 }
  )
}

const getPrecipitationLevel = (amount: number): FishingSessionForm['precipitation'] => {
  if (amount <= 0) return 'Kein'
  if (amount < 2.5) return 'Leicht'
  if (amount < 10) return 'Mittel'
  return 'Stark'
}

const getCurrentCoordinates = () => new Promise<GeolocationCoordinates>((resolve, reject) => {
  if (!window.isSecureContext) {
    reject(new Error('Die Standortbestimmung ist nur über HTTPS oder localhost verfügbar.'))
    return
  }
  if (!navigator.geolocation) {
    reject(new Error('Dieser Browser unterstützt keine Standortbestimmung.'))
    return
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve(coords),
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        reject(new Error('Der Zugriff auf den Standort wurde verweigert. Bitte erteile dem Browser die Berechtigung.'))
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        reject(new Error('Die aktuelle Position ist nicht verfügbar.'))
      } else if (error.code === error.TIMEOUT) {
        reject(new Error('Die Standortbestimmung hat zu lange gedauert. Bitte versuche es erneut.'))
      } else {
        reject(new Error('Die Standortbestimmung ist fehlgeschlagen.'))
      }
    },
    { enableHighAccuracy: true, timeout: 15000 }
  )
})

const getWeatherFromLocation = async () => {
  weatherMessage.value = ''
  weatherError.value = ''

  const water = props.waters.find((entry) => entry.id === form.value.waterId)
  if (!water) {
    weatherError.value = 'Bitte wähle zuerst ein Gewässer aus.'
    return
  }
  const latitude = water.latitude
  const longitude = water.longitude
  if (
    latitude !== undefined
    && longitude !== undefined
    && (
      !Number.isFinite(latitude)
      || !Number.isFinite(longitude)
      || latitude < -90
      || latitude > 90
      || longitude < -180
      || longitude > 180
    )
  ) {
    weatherError.value = 'Für dieses Gewässer sind ungültige GPS-Koordinaten hinterlegt.'
    return
  }

  const selectedTime = form.value.from
  const selectedDate = selectedTime.slice(0, 10)
  const selectedHour = `${selectedTime.slice(0, 13)}:00`
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(selectedTime)) {
    weatherError.value = 'Bitte gib zuerst einen gültigen Beginn des Angeltermins ein.'
    return
  }

  isLoadingWeather.value = true
  try {
    const hasWaterCoordinates = latitude !== undefined && longitude !== undefined
    const coordinates = hasWaterCoordinates
      ? { latitude, longitude }
      : await getCurrentCoordinates()
    const coordinateSource = hasWaterCoordinates
      ? `Gewässer „${water.name}“`
      : 'aktuelle Position (Gewässer ohne GPS-Koordinaten)'
    const today = new Date().toLocaleDateString('sv-SE')
    const endpoint = selectedDate < today
      ? 'https://archive-api.open-meteo.com/v1/archive'
      : 'https://api.open-meteo.com/v1/forecast'
    const url = new URL(endpoint)
    url.search = new URLSearchParams({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      hourly: 'temperature_2m,cloud_cover,precipitation',
      start_date: selectedDate,
      end_date: selectedDate,
      timezone: 'auto',
      ...(selectedDate >= today ? { past_days: '1', forecast_days: '16' } : {})
    }).toString()

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Der Wetterdienst antwortete mit HTTP ${response.status}.`)
    }

    const weather = await response.json() as WeatherResponse
    const hourly = weather.hourly
    const hourIndex = hourly?.time?.indexOf(selectedHour) ?? -1
    const temperature = hourly?.temperature_2m?.[hourIndex]
    const cloudCover = hourly?.cloud_cover?.[hourIndex]
    const precipitation = hourly?.precipitation?.[hourIndex]
    if (
      hourIndex < 0
      || temperature == null
      || cloudCover == null
      || precipitation == null
      || !Number.isFinite(temperature)
      || !Number.isFinite(cloudCover)
      || !Number.isFinite(precipitation)
    ) {
      throw new Error('Für diesen Zeitpunkt sind keine vollständigen Wetterdaten verfügbar.')
    }

    form.value.temperature = temperature
    form.value.population = cloudCover
    form.value.precipitation = getPrecipitationLevel(precipitation)
    weatherMessage.value = `Wetterdaten für ${selectedHour} Uhr von ${coordinateSource} übernommen. Niederschlag: ${precipitation} mm/Stunde.`
  } catch (error) {
    weatherError.value = error instanceof Error
      ? error.message
      : 'Die Wetterdaten konnten nicht abgerufen werden.'
  } finally {
    isLoadingWeather.value = false
  }
}
</script>

<template>
  <div class="box">
    <h2 class="subtitle is-6">Angeltermin erfassen</h2>
    <div class="columns is-multiline">
      <div class="column is-half">
        <label class="label">Von</label>
        <input v-model="form.from" type="datetime-local" class="input" />
      </div>
      <div class="column is-half">
        <label class="label">Bis</label>
        <input v-model="form.to" type="datetime-local" class="input" />
      </div>
      <div class="column is-one-third">
        <label class="label">Temperatur °C</label>
        <input v-model="form.temperature" type="number" class="input" />
      </div>
      <div class="column is-one-third">
        <label class="label">Bewölkerung %</label>
        <input v-model="form.population" type="number" min="0" max="100" class="input" />
      </div>
      <div class="column is-one-third">
        <label class="label">Niederschlag</label>
        <div class="select is-fullwidth">
          <select v-model="form.precipitation">
            <option>Kein</option>
            <option>Leicht</option>
            <option>Mittel</option>
            <option>Stark</option>
          </select>
        </div>
      </div>
      <div class="column is-full">
        <label class="label">Gewässer</label>
        <div class="select is-fullwidth">
          <select v-model="form.waterId">
            <option v-for="water in waters" :key="water.id" :value="water.id">
              {{ water.location ? `${water.name} (${water.location})` : water.name }}
            </option>
          </select>
        </div>
        <div class="buttons mt-2">
          <button
            class="button is-light"
            type="button"
            :disabled="isFindingWater"
            @click="findWaterFromPosition"
          >
            <span aria-hidden="true">◎</span>&nbsp;
            {{ isFindingWater ? 'Gewässer wird gesucht …' : 'Aus Standort ermitteln' }}
          </button>
          <button
            class="button is-light"
            type="button"
            :disabled="isLoadingWeather"
            @click="getWeatherFromLocation"
          >
            {{ isLoadingWeather ? 'Wetter wird ermittelt …' : 'Wetter aus Standort ermitteln' }}
          </button>
        </div>
        <p v-if="locationMessage" class="help" role="status">{{ locationMessage }}</p>
        <p v-if="locationError" class="help is-danger" role="alert">{{ locationError }}</p>
        <p class="help">
          Wetter für den Beginn des Angeltermins. Niederschlag pro Stunde: leicht unter 2,5 mm,
          mittel unter 10 mm, stark ab 10 mm.
        </p>
        <p v-if="weatherMessage" class="help" role="status">{{ weatherMessage }}</p>
        <p v-if="weatherError" class="help is-danger" role="alert">{{ weatherError }}</p>
        <p class="help">
          Wetterdaten:
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
          (CC BY 4.0)
        </p>
      </div>
    </div>
    <button class="button is-primary mt-3" @click="$emit('submit')">Angeltermin speichern</button>
  </div>
</template>
