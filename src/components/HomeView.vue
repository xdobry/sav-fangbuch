<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CatchView from './CatchView.vue'
import FishingEventForm from './FishingEventForm.vue'
import { defaultSpecies } from '../data/defaults'
import { readPhotoMetadata } from '../services/photoMetadata'
import { extendSessionToCatch, planPhotoSession } from '../services/photoSession'
import { createId } from '../utils/createId'
import type { CatchForm, FangbuchData, FishingSession, FishingSessionForm, PhotoMetadata } from '../types'

const data = defineModel<FangbuchData>('data', { required: true })
const emit = defineEmits<{
  save: [onError?: () => void]
}>()
const saveData = () => emit('save')
const species = defaultSpecies
const getLocalDateTime = (date = new Date()) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
const selectedSessionId = ref('')
const isStartingTour = ref(false)
const editingSessionId = ref<string | null>(null)
const isEnteringCatch = ref(false)
const homeMessage = ref('')
const tourMessage = ref('')
const photoInput = ref<HTMLInputElement | null>(null)
const isReadingPhoto = ref(false)
const photoMessage = ref('')
const photoError = ref('')
const isPhotoCatch = ref(false)
const pendingPhoto = ref<PhotoMetadata | null>(null)
const photoTourForm = ref<FishingSessionForm | null>(null)
const editingCatchId = ref<string | null>(null)
const sessionForm = ref<FishingSessionForm>({
  from: getLocalDateTime(),
  to: getLocalDateTime(),
  temperature: 18,
  population: 50,
  precipitation: 'Kein',
  waterId: data.value.waters[0]?.id ?? ''
})

const latestCatch = () =>
  [...data.value.catches].sort((first, second) => second.time.localeCompare(first.time))[0]
const createCatchForm = (): CatchForm => {
  const previousCatch = latestCatch()
  return {
    time: getLocalDateTime(),
    speciesId: previousCatch?.speciesId ?? species[0]?.id ?? '',
    lengthCm: previousCatch?.lengthCm ?? 25,
    weightKg: 0.0,
    rodId: previousCatch?.rodId ?? data.value.rods[0]?.id ?? '',
    baitId: previousCatch?.baitId ?? data.value.baits[0]?.id ?? '',
    montageId: previousCatch?.montageId ?? data.value.montages[0]?.id ?? '',
    montageWeight: 0,
    retained: false,
    photo: '',
    notes: ''
  }
}
const catchForm = ref<CatchForm>(createCatchForm())

watch(() => data.value.waters.map((water) => water.id), (waterIds) => {
  if (!waterIds.includes(sessionForm.value.waterId)) {
    sessionForm.value.waterId = waterIds[0] ?? ''
  }
})

watch(
  () => [
    data.value.rods.map((rod) => rod.id),
    data.value.baits.map((bait) => bait.id),
    data.value.montages.map((montage) => montage.id)
  ] as const,
  (selections, previousSelections) => {
    const fields = ['rodId', 'baitId', 'montageId'] as const
    fields.forEach((field, index) => {
      const ids = selections[index]!
      const addedId = ids.find((id) => !previousSelections[index]!.includes(id))
      if (addedId) catchForm.value[field] = addedId
      else if (!ids.includes(catchForm.value[field] ?? '')) catchForm.value[field] = ids[0] ?? ''
    })
  }
)

const addFishingSession = () => {
  if (!sessionForm.value.waterId) return

  const newSession: FishingSession = {
    id: createId(),
    from: sessionForm.value.from,
    to: sessionForm.value.to,
    temperature: Number(sessionForm.value.temperature),
    population: Number(sessionForm.value.population),
    precipitation: sessionForm.value.precipitation,
    windSpeed10m: sessionForm.value.windSpeed10m,
    windDirection10m: sessionForm.value.windDirection10m,
    weatherCode: sessionForm.value.weatherCode,
    sunrise: sessionForm.value.sunrise,
    sunset: sessionForm.value.sunset,
    waterId: sessionForm.value.waterId,
    notes: sessionForm.value.notes
  }
  data.value.sessions.unshift(newSession)
  cancelCatchEdit()
  selectedSessionId.value = newSession.id
  isStartingTour.value = false
  tourMessage.value = ''
  saveData()
}

const saveActiveTour = () => {
  if (!sessionForm.value.waterId) return

  const sessionIndex = data.value.sessions.findIndex((session) => session.id === editingSessionId.value)
  if (sessionIndex < 0) return

  data.value.sessions[sessionIndex] = {
    ...data.value.sessions[sessionIndex]!,
    from: sessionForm.value.from,
    to: sessionForm.value.to,
    temperature: Number(sessionForm.value.temperature),
    population: Number(sessionForm.value.population),
    precipitation: sessionForm.value.precipitation,
    windSpeed10m: sessionForm.value.windSpeed10m,
    windDirection10m: sessionForm.value.windDirection10m,
    weatherCode: sessionForm.value.weatherCode,
    sunrise: sessionForm.value.sunrise,
    sunset: sessionForm.value.sunset,
    waterId: sessionForm.value.waterId,
    notes: sessionForm.value.notes
  }
  editingSessionId.value = null
  isStartingTour.value = false
  tourMessage.value = ''
  saveData()
}

const startTour = () => {
  const now = getLocalDateTime()
  const today = now.slice(0, 10)
  const previousTourToday = [...data.value.sessions]
    .filter((session) => session.to && session.from.slice(0, 10) === today)
    .sort((first, second) => second.from.localeCompare(first.from))[0]

  if (previousTourToday) {
    const waterName = data.value.waters.find((water) => water.id === previousTourToday.waterId)?.name
      ?? 'Unbekanntes Gewässer'
    const startTime = new Date(previousTourToday.from).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
    if (window.confirm(`Tour ${waterName} von ${startTime} wieder öffnen?`)) {
      previousTourToday.to = ''
      selectedSessionId.value = previousTourToday.id
      editingSessionId.value = null
      isStartingTour.value = false
      tourMessage.value = ''
      homeMessage.value = ''
      saveData()
      return
    }
  }

  sessionForm.value = {
    ...sessionForm.value,
    from: now,
    to: '',
    waterId: sessionForm.value.waterId || data.value.waters[0]?.id || ''
  }
  editingSessionId.value = null
  tourMessage.value = ''
  homeMessage.value = ''
  isStartingTour.value = true
}

const editTour = (session: FishingSession) => {
  editingSessionId.value = session.id
  sessionForm.value = {
    from: session.from,
    to: session.to,
    temperature: session.temperature,
    population: session.population,
    precipitation: session.precipitation,
    windSpeed10m: session.windSpeed10m,
    windDirection10m: session.windDirection10m,
    weatherCode: session.weatherCode,
    sunrise: session.sunrise,
    sunset: session.sunset,
    waterId: session.waterId,
    notes: session.notes
  }
  tourMessage.value = ''
  isStartingTour.value = true
}

const cancelTourForm = () => {
  editingSessionId.value = null
  isStartingTour.value = false
}

const endTour = () => {
  const session = activeSession.value
  if (!session) return

  session.to = getLocalDateTime()
  saveData()
}

const discardActiveTour = () => {
  const session = activeSession.value
  if (!session) return
  if (data.value.catches.some((entry) => entry.sessionId === session.id)) {
    tourMessage.value = 'Tour hat bereits erfasste Fänge'
    return
  }
  if (!window.confirm('Möchten Sie diese Tour wirklich verwerfen?')) return

  data.value.sessions = data.value.sessions.filter((entry) => entry.id !== session.id)
  if (selectedSessionId.value === session.id) selectedSessionId.value = ''
  editingSessionId.value = null
  isStartingTour.value = false
  tourMessage.value = ''
  saveData()
}

const openPhotoCatch = (photo: PhotoMetadata, session: FishingSession, isNew: boolean) => {
  const previousSessions = data.value.sessions
  data.value.sessions = isNew
    ? [session, ...previousSessions]
    : previousSessions.map((entry) => entry.id === session.id ? session : entry)
  let saveFailed = false
  emit('save', () => {
    saveFailed = true
    data.value.sessions = previousSessions
    photoError.value = 'Die Tour konnte nicht gespeichert werden. Bitte prüfe den verfügbaren Browser-Speicher.'
  })
  if (saveFailed) return

  cancelCatchEdit()
  let latitude = photo.latitude
  let longitude = photo.longitude
  if (!latitude) {
    const fwater = data.value.waters.find((w) => w.id === session.waterId)
    if (fwater) {
        latitude = fwater.latitude
        longitude = fwater.longitude
    }
  }
  catchForm.value = { ...createCatchForm(), time: photo.time, latitude, longitude }
  selectedSessionId.value = session.id
  isPhotoCatch.value = true
  isEnteringCatch.value = true
  isStartingTour.value = false
  homeMessage.value = ''
  photoError.value = ''
  photoMessage.value = isNew ? `Eine neue Tour ${formatCatchDate(session.from)} wurde angelegt` : ''
}

const onPhotoSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || isReadingPhoto.value) return

  isReadingPhoto.value = true
  photoMessage.value = ''
  photoError.value = ''
  try {
    const photo = await readPhotoMetadata(file)
    if (!photo) {
      photoError.value = 'Photo beinhaltet keine Zeit und GPS angaben'
      return
    }
    if (!data.value.waters.length) {
      photoError.value = 'Lege zuerst ein Gewässer an, bevor du einen Fang erfassen kannst.'
      return
    }

    const plan = planPhotoSession(photo, data.value.waters, data.value.sessions)
    if (plan.kind === 'manual') {
      cancelCatchEdit()
      pendingPhoto.value = photo
      photoTourForm.value = plan.session
      photoMessage.value = 'Kein Gewässer innerhalb von 5 km gefunden. Bitte wähle ein Gewässer für die Tour.'
    } else if (plan.kind === 'existing') {
      openPhotoCatch(photo, plan.session, false)
    } else {
      openPhotoCatch(photo, { id: createId(), ...plan.session }, true)
    }
  } catch {
    photoError.value = 'Das Photo konnte nicht gelesen werden.'
  } finally {
    isReadingPhoto.value = false
  }
}

const savePhotoTour = () => {
  const photo = pendingPhoto.value
  const form = photoTourForm.value
  if (!photo || !form) return
  if (!data.value.waters.some((water) => water.id === form.waterId)) {
    photoError.value = 'Bitte wähle ein Gewässer aus.'
    return
  }
  if (!form.from || (form.to && form.to < form.from)) {
    photoError.value = 'Bitte gib einen gültigen Tourzeitraum ein.'
    return
  }
  openPhotoCatch(photo, { id: createId(), ...form, ...extendSessionToCatch(form, photo.time) }, true)
}

const cancelPhotoTour = () => {
  pendingPhoto.value = null
  photoTourForm.value = null
  photoMessage.value = ''
  photoError.value = ''
}

const enterCatch = () => {
  let session = activeSession.value
  if (!session) {
    const waterId = sessionForm.value.waterId || data.value.waters[0]?.id
    if (!waterId) {
      homeMessage.value = 'Lege zuerst ein Gewässer an, bevor du einen Fang erfassen kannst.'
      return
    }

    session = {
      id: createId(),
      from: getLocalDateTime(),
      to: '',
      temperature: 0,
      population: 0,
      precipitation: 'Kein',
      waterId
    }
    data.value.sessions.unshift(session)
    saveData()
  }

  cancelCatchEdit()
  selectedSessionId.value = session.id
  isStartingTour.value = false
  isEnteringCatch.value = true
  homeMessage.value = ''
}

const saveCatch = () => {
  if (!selectedSessionId.value || !catchForm.value.speciesId || !catchForm.value.rodId || !catchForm.value.baitId || !catchForm.value.montageId) return

  if (isPhotoCatch.value) {
    const session = data.value.sessions.find((entry) => entry.id === selectedSessionId.value)
    if (!session) return
    Object.assign(session, extendSessionToCatch(session, catchForm.value.time))
  }

  const catchData = {
    time: catchForm.value.time,
    speciesId: catchForm.value.speciesId,
    lengthCm: Number(catchForm.value.lengthCm),
    weightKg: catchForm.value.weightKg ? Number(catchForm.value.weightKg) : undefined,
    rodId: catchForm.value.rodId,
    baitId: catchForm.value.baitId,
    montageId: catchForm.value.montageId,
    montageWeight: catchForm.value.montageWeight === undefined
      ? undefined
      : Number(catchForm.value.montageWeight),
    retained: Boolean(catchForm.value.retained),
    latitude: catchForm.value.latitude,
    longitude: catchForm.value.longitude,
    photo: catchForm.value.photo,
    notes: catchForm.value.notes
  }

  if (editingCatchId.value) {
    const index = data.value.catches.findIndex((entry) => entry.id === editingCatchId.value)
    if (index < 0) return
    data.value.catches[index] = {
      ...data.value.catches[index]!,
      ...catchData
    }
  } else {
    data.value.catches.unshift({
      id: createId(),
      sessionId: selectedSessionId.value,
      ...catchData
    })
  }

  cancelCatchEdit()
  isEnteringCatch.value = false
  saveData()
}

const editCatch = (catchId: string) => {
  const entry = data.value.catches.find((catchEntry) => catchEntry.id === catchId)
  if (!entry) return

  isPhotoCatch.value = false
  cancelPhotoTour()
  if (selectedSessionId.value !== entry.sessionId) cancelCatchEdit()
  selectedSessionId.value = entry.sessionId
  isEnteringCatch.value = true
  editingCatchId.value = entry.id
  catchForm.value = {
    time: entry.time,
    speciesId: entry.speciesId,
    lengthCm: entry.lengthCm,
    weightKg: entry.weightKg,
    rodId: entry.rodId,
    baitId: entry.baitId,
    montageId: entry.montageId ?? data.value.montages[0]?.id ?? '',
    montageWeight: entry.montageWeight ?? 0,
    retained: entry.retained ?? false,
    latitude: entry.latitude,
    longitude: entry.longitude,
    photo: entry.photo ?? '',
    notes: entry.notes ?? ''
  }
}

const deleteCatch = (catchId: string) => {
  const index = data.value.catches.findIndex((entry) => entry.id === catchId)
  if (index < 0) return

  const entry = data.value.catches[index]!
  const fishName = species.find((fish) => fish.id === entry.speciesId)?.name ?? 'Unbekannter Fisch'
  if (!window.confirm(`Möchten Sie wirklich den Fang: ${fishName} vom ${formatCatchDate(entry.time)} löschen?`)) return

  data.value.catches.splice(index, 1)
  if (editingCatchId.value === catchId) cancelCatchEdit()
  saveData()
}

const cancelCatchEdit = () => {
  isPhotoCatch.value = false
  pendingPhoto.value = null
  photoTourForm.value = null
  editingCatchId.value = null
  catchForm.value = createCatchForm()
  isEnteringCatch.value = false
}

const selectedSession = computed(() =>
  data.value.sessions.find((session) => session.id === selectedSessionId.value) ?? null
)
const activeSession = computed(() => data.value.sessions.find((session) => !session.to) ?? null)
const activeSessionWaterName = computed(() =>
  data.value.waters.find((water) => water.id === activeSession.value?.waterId)?.name ?? 'Unbekanntes Gewässer'
)
const catchesForSelectedSession = computed(() =>
  data.value.catches.filter((entry) => entry.sessionId === selectedSessionId.value)
)
const catchesForSession = (sessionId: string) =>
  data.value.catches
    .filter((entry) => entry.sessionId === sessionId)
    .sort((first, second) => second.time.localeCompare(first.time))
const latestCatches = computed(() =>
  [...data.value.catches]
    .sort((first, second) => second.time.localeCompare(first.time))
    .slice(0, 10)
)
const formatCatchDate = (time: string) => {
  const date = new Date(time)
  return Number.isNaN(date.getTime()) ? time : date.toLocaleDateString('de-DE')
}
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title is-4">Start</h1>

      <div class="box">
        <template v-if="activeSession">
          <p class="mb-3">
            Aktive Tour seit {{ activeSession.from }} ·
            {{ activeSessionWaterName }} ·
            {{ catchesForSession(activeSession.id).length }} Fänge
          </p>
          <div class="buttons">
            <button class="button is-warning" type="button" @click="endTour">Tour beenden</button>
            <button class="button is-light" type="button" @click="editTour(activeSession)">Tour bearbeiten</button>
            <button class="button is-danger is-light" type="button" @click="discardActiveTour">Tour verwerfen</button>
          </div>
        </template>
        <template v-else-if="!isStartingTour">
          <p class="mb-3">Es ist keine Tour aktiv.</p>
          <button class="button is-primary" type="button" @click="startTour">Tour starten</button>
        </template>
        <p v-if="tourMessage" class="help is-danger mt-2" role="alert">{{ tourMessage }}</p>
      </div>
      <FishingEventForm
        v-if="isStartingTour"
        v-model="sessionForm"
        :waters="data.waters"
        :heading="editingSessionId ? 'Tour bearbeiten' : 'Tour starten'"
        :submit-label="editingSessionId ? 'Tour speichern' : 'Tour starten'"
        :show-cancel="true"
        @submit="editingSessionId ? saveActiveTour() : addFishingSession()"
        @cancel="cancelTourForm"
      />

      <div class="box">
        <div class="photo-catch-actions">
          <button class="button is-link" type="button" :disabled="isReadingPhoto" @click="enterCatch">Fang erfassen</button>
          <button
            class="button is-link is-light"
            :class="{ 'is-loading': isReadingPhoto }"
            type="button"
            :disabled="isReadingPhoto"
            @click="photoInput?.click()"
          >
            Fang aus Foto erfassen
          </button>
          <input ref="photoInput" type="file" accept="image/*" hidden @change="onPhotoSelected" />
          <span v-if="photoMessage" class="has-text-success" role="status">{{ photoMessage }}</span>
          <span v-if="photoError" class="has-text-danger" role="alert">{{ photoError }}</span>
        </div>
        <p v-if="homeMessage" class="help is-danger mt-2" role="alert">{{ homeMessage }}</p>
      </div>

      <FishingEventForm
        v-if="photoTourForm"
        v-model="photoTourForm"
        :waters="data.waters"
        heading="Tour für Fotofang"
        submit-label="Tour anlegen"
        :show-cancel="true"
        @submit="savePhotoTour"
        @cancel="cancelPhotoTour"
      />

      <CatchView
        v-if="isEnteringCatch && selectedSession"
        v-model="catchForm"
        :waters="data.waters"
        :species="species"
        :rods="data.rods"
        :baits="data.baits"
        :montages="data.montages"
        :catches="catchesForSelectedSession"
        :session="selectedSession"
        :editing-catch-id="editingCatchId"
        :show-catch-list="false"
        :show-cancel="true"
        :auto-locate="!isPhotoCatch"
        @submit="saveCatch"
        @edit="editCatch"
        @delete="deleteCatch"
        @cancel-edit="cancelCatchEdit"
      />

      <div class="box">
        <h2 class="subtitle is-6">Letzte 10 Fänge</h2>
        <p v-if="latestCatches.length === 0" class="has-text-grey">Noch keine Fänge erfasst.</p>
        <div v-else class="content">
          <div v-for="entry in latestCatches" :key="entry.id" class="catch-row">
            <span>
              {{ formatCatchDate(entry.time) }} ·
              {{ species.find((fish) => fish.id === entry.speciesId)?.name ?? 'Unbekannter Fisch' }} ·
              {{ entry.lengthCm }} cm
            </span>
            <div class="buttons are-small">
              <button class="button is-light" type="button" @click="editCatch(entry.id)">Bearbeiten</button>
              <button class="button is-danger is-light" type="button" @click="deleteCatch(entry.id)">Löschen</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.photo-catch-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.photo-catch-actions > span {
  overflow-wrap: anywhere;
  min-width: 0;
}

.photo-catch-actions > .button {
  max-width: 100%;
  min-height: 2.5em;
  height: auto;
  white-space: normal;
}

.content ul {
  margin-left: 1.25rem;
}

.catch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

@media (max-width: 600px) {
  .catch-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>