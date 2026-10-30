<script setup lang="ts">
import { ref } from 'vue'
import type { FishingSessionForm, Water } from '../types'

const props = withDefaults(defineProps<{
  waters: Water[]
  heading?: string
  submitLabel?: string
  showCancel?: boolean
}>(), {
  heading: 'Tour erfassen',
  submitLabel: 'Tour speichern',
  showCancel: false
})
const form = defineModel<FishingSessionForm>({ required: true })
defineEmits<{ submit: []; cancel: [] }>()

const isFindingWater = ref(false)
const locationMessage = ref('')
const locationError = ref('')
const isLoadingWeather = ref(false)
const weatherMessage = ref('')
const weatherError = ref('')

type WeatherResponse = {
  daily?: {
    time?: string[]
    sunrise?: (string | null)[]
    sunset?: (string | null)[]
  }
  hourly?: {
    time?: string[]
    temperature_2m?: (number | null)[]
    cloud_cover?: (number | null)[]
    wind_speed_10m?: (number | null)[]
    wind_direction_10m?: (number | null)[]
    weather_code?: (number | null)[]
    rain?: (number | null)[]
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
    weatherError.value = 'Bitte gib zuerst einen gültigen Beginn der Tour ein.'
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
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())
    const endpoint = selectedDate < today
      ? 'https://archive-api.open-meteo.com/v1/archive'
      : 'https://api.open-meteo.com/v1/forecast'
    const forecastDays = Math.min(
      16,
      Math.max(1, Math.floor((Date.parse(`${selectedDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000) + 1)
    )
    const url = new URL(endpoint)
    const parameters = new URLSearchParams({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      daily: 'sunrise,sunset',
      hourly: 'temperature_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,rain',
      timezone: 'Europe/Berlin',
      ...(selectedDate < today
        ? { start_date: selectedDate, end_date: selectedDate }
        : { past_days: '1', forecast_days: String(forecastDays) })
    })
    url.search = parameters.toString()

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Der Wetterdienst antwortete mit HTTP ${response.status}.`)
    }

    const weather = await response.json() as WeatherResponse
    const hourly = weather.hourly
    const hourIndex = hourly?.time?.indexOf(selectedHour) ?? -1
    const temperature = hourly?.temperature_2m?.[hourIndex]
    const cloudCover = hourly?.cloud_cover?.[hourIndex]
    const windSpeed = hourly?.wind_speed_10m?.[hourIndex]
    const windDirection = hourly?.wind_direction_10m?.[hourIndex]
    const weatherCode = hourly?.weather_code?.[hourIndex]
    const precipitation = hourly?.rain?.[hourIndex]
    if (
      hourIndex < 0
      || temperature == null
      || cloudCover == null
      || windSpeed == null
      || windDirection == null
      || weatherCode == null
      || precipitation == null
      || !Number.isFinite(temperature)
      || !Number.isFinite(cloudCover)
      || !Number.isFinite(windSpeed)
      || !Number.isFinite(windDirection)
      || !Number.isFinite(weatherCode)
      || !Number.isFinite(precipitation)
    ) {
      throw new Error('Für diesen Zeitpunkt sind keine vollständigen Wetterdaten verfügbar.')
    }

    const dayIndex = weather.daily?.time?.indexOf(selectedDate) ?? -1
    const getSunTime = (value: string | null | undefined) => {
      if (!value?.startsWith(`${selectedDate}T`)) return undefined
      const time = value.slice(11)
      return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : undefined
    }

    form.value.sunrise = getSunTime(weather.daily?.sunrise?.[dayIndex])
    form.value.sunset = getSunTime(weather.daily?.sunset?.[dayIndex])
    form.value.temperature = temperature
    form.value.population = cloudCover
    form.value.windSpeed10m = windSpeed
    form.value.windDirection10m = windDirection
    form.value.weatherCode = weatherCode
    form.value.precipitation = getPrecipitationLevel(precipitation)
    weatherMessage.value = `Wetterdaten für ${selectedHour} Uhr von ${coordinateSource} übernommen. Wind: ${windSpeed} km/h aus ${windDirection}°, Wettercode: ${weatherCode}, Niederschlag: ${precipitation} mm/Stunde.`
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
    <h2 class="subtitle is-6">{{ props.heading }}</h2>
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
      <div class="column is-one-third">
        <label class="label">Windstärke km/h</label>
        <input v-model.number="form.windSpeed10m" type="number" min="0" step="any" class="input" />
      </div>
      <div class="column is-one-third">
        <label class="label">Windrichtung °</label>
        <input v-model.number="form.windDirection10m" type="number" min="0" max="360" step="any" class="input" />
      </div>
      <div class="column is-one-third">
        <label class="label">Wettercode</label>
        <input v-model.number="form.weatherCode" type="number" min="0" step="1" class="input" />
      </div>
      <div class="column is-half">
        <label class="label" for="session-sunrise">Sonnenaufgang</label>
        <input id="session-sunrise" v-model="form.sunrise" type="time" class="input" />
      </div>
      <div class="column is-half">
        <label class="label" for="session-sunset">Sonnenuntergang</label>
        <input id="session-sunset" v-model="form.sunset" type="time" class="input" />
      </div>
      <div class="column is-full">
        <label class="label">Gewässer</label>
        <div class="select is-fullwidth">
          <select v-model="form.waterId">
            <option disabled value="">Gewässer auswählen</option>
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
          Wetter für den Beginn der Tour. Niederschlag pro Stunde: leicht unter 2,5 mm,
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
    <div class="buttons mt-3">
      <button class="button is-primary" type="button" @click="$emit('submit')">{{ props.submitLabel }}</button>
      <button v-if="props.showCancel" class="button" type="button" @click="$emit('cancel')">Abbrechen</button>
    </div>
  </div>
</template>
