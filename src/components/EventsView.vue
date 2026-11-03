<script setup lang="ts">
import { computed, ref } from 'vue'
import CatchView from './CatchView.vue'
import FishingEventForm from './FishingEventForm.vue'
import { createId } from '../utils/createId'
import type { Bait, CatchEntry, CatchForm, FishSpecies, FishingSession, FishingSessionForm, Montage, Rod, Water } from '../types'

const props = defineProps<{
  waters: Water[]
  species: FishSpecies[]
  rods: Rod[]
  baits: Bait[]
  montages: Montage[]
}>()
const sessions = defineModel<FishingSession[]>('sessions', { required: true })
const catches = defineModel<CatchEntry[]>('catches', { required: true })
const emit = defineEmits<{
  save: []
}>()
const getLocalDateTime = (date = new Date()) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
const selectedSessionId = ref('')
const expandedSessionId = ref('')
const isCreatingTour = ref(false)
const editingSessionId = ref<string | null>(null)
const isEnteringCatch = ref(false)
const editingCatchId = ref<string | null>(null)
const tourMessage = ref('')
const sessionForm = ref<FishingSessionForm>({
  from: getLocalDateTime(),
  to: getLocalDateTime(),
  temperature: 18,
  population: 50,
  precipitation: 'Kein',
  waterId: props.waters[0]?.id ?? ''
})
const createCatchForm = (): CatchForm => {
  const previousCatch = [...catches.value].sort((first, second) => second.time.localeCompare(first.time))[0]
  return {
    time: getLocalDateTime(),
    speciesId: previousCatch?.speciesId ?? props.species[0]?.id ?? '',
    lengthCm: previousCatch?.lengthCm ?? 25,
    weightKg: 0.0,
    rodId: previousCatch?.rodId ?? props.rods[0]?.id ?? '',
    baitId: previousCatch?.baitId ?? props.baits[0]?.id ?? '',
    montageId: previousCatch?.montageId ?? props.montages[0]?.id ?? '',
    montageWeight: 0,
    retained: false,
    photo: '',
    notes: ''
  }
}
const catchForm = ref<CatchForm>(createCatchForm())
const selectedSession = computed(() =>
  sessions.value.find((session) => session.id === selectedSessionId.value) ?? null
)
const sortedSessions = computed(() =>
  [...sessions.value].sort((first, second) => second.from.localeCompare(first.from))
)
const catchesForSession = (sessionId: string) =>
  catches.value
    .filter((entry) => entry.sessionId === sessionId)
    .sort((first, second) => second.time.localeCompare(first.time))
const catchesForSelectedSession = computed(() => catchesForSession(selectedSessionId.value))
const formatCatchDate = (time: string) => {
  const date = new Date(time)
  return Number.isNaN(date.getTime()) ? time : date.toLocaleDateString('de-DE')
}

const openNewTourForm = () => {
  const now = getLocalDateTime()
  editingSessionId.value = null
  sessionForm.value = {
    ...sessionForm.value,
    from: now,
    to: now,
    waterId: sessionForm.value.waterId || props.waters[0]?.id || '',
    notes: ''
  }
  tourMessage.value = ''
  isCreatingTour.value = true
}

const cancelTourForm = () => {
  editingSessionId.value = null
  isCreatingTour.value = false
}

const saveTour = () => {
  if (!sessionForm.value.waterId) return

  const sessionData: FishingSessionForm = {
    ...sessionForm.value,
    temperature: Number(sessionForm.value.temperature),
    population: Number(sessionForm.value.population)
  }
  if (editingSessionId.value) {
    const sessionIndex = sessions.value.findIndex((session) => session.id === editingSessionId.value)
    if (sessionIndex < 0) return
    sessions.value = sessions.value.map((session, index) =>
      index === sessionIndex ? { ...session, ...sessionData } : session
    )
  } else {
    const newSession = { id: createId(), ...sessionData }
    sessions.value = [newSession, ...sessions.value]
    cancelCatchEdit()
    selectedSessionId.value = newSession.id
  }
  cancelTourForm()
  tourMessage.value = ''
  emit('save')
}

const editTour = (session: FishingSession) => {
  editingSessionId.value = session.id
  const { id, ...form } = session
  sessionForm.value = form
  tourMessage.value = ''
  isCreatingTour.value = false
  expandedSessionId.value = session.id
}

const deleteTour = (sessionId: string) => {
  const session = sessions.value.find((entry) => entry.id === sessionId)
  if (!session) return
  if (catches.value.some((entry) => entry.sessionId === sessionId)) {
    tourMessage.value = 'Tour hat bereits erfasste Fänge'
    return
  }

  const waterName = props.waters.find((water) => water.id === session.waterId)?.name ?? 'Unbekanntes Gewässer'
  if (!window.confirm(`Möchten Sie die Tour am ${formatCatchDate(session.from)} am Gewässer „${waterName}“ wirklich löschen?`)) return

  sessions.value = sessions.value.filter((entry) => entry.id !== sessionId)
  if (selectedSessionId.value === sessionId) {
    selectedSessionId.value = ''
    cancelCatchEdit()
  }
  if (expandedSessionId.value === sessionId) expandedSessionId.value = ''
  if (editingSessionId.value === sessionId) cancelTourForm()
  tourMessage.value = ''
  emit('save')
}

const addCatchToTour = (sessionId: string) => {
  const session = sessions.value.find((entry) => entry.id === sessionId)
  if (!session) return

  cancelCatchEdit()
  selectedSessionId.value = sessionId
  expandedSessionId.value = sessionId
  const now = getLocalDateTime()
  if (session.from.slice(0, 10) === now.slice(0, 10)) {
    catchForm.value.time = now
  } else {
    catchForm.value.time = session.from
    const water = props.waters.find((entry) => entry.id === session.waterId)
    catchForm.value.latitude = water?.latitude
    catchForm.value.longitude = water?.longitude
  }
  isEnteringCatch.value = true
}

const toggleTour = (sessionId: string) => {
  if (expandedSessionId.value === sessionId) {
    expandedSessionId.value = ''
    if (selectedSessionId.value === sessionId) cancelCatchEdit()
    return
  }
  expandedSessionId.value = sessionId
}

const saveCatch = () => {
  if (!selectedSessionId.value || !catchForm.value.speciesId || !catchForm.value.rodId || !catchForm.value.baitId || !catchForm.value.montageId) return

  const catchData: CatchForm = {
    ...catchForm.value,
    lengthCm: Number(catchForm.value.lengthCm),
    weightKg: catchForm.value.weightKg ? Number(catchForm.value.weightKg) : undefined,
    montageWeight: catchForm.value.montageWeight === undefined
      ? undefined
      : Number(catchForm.value.montageWeight),
    retained: Boolean(catchForm.value.retained)
  }
  if (editingCatchId.value) {
    const index = catches.value.findIndex((entry) => entry.id === editingCatchId.value)
    if (index < 0) return
    catches.value = catches.value.map((entry, catchIndex) =>
      catchIndex === index ? { ...entry, ...catchData } : entry
    )
  } else {
    catches.value = [{ id: createId(), sessionId: selectedSessionId.value, ...catchData }, ...catches.value]
  }
  cancelCatchEdit()
  emit('save')
}

const editCatch = (catchId: string) => {
  const entry = catches.value.find((catchEntry) => catchEntry.id === catchId)
  if (!entry) return

  if (selectedSessionId.value !== entry.sessionId) cancelCatchEdit()
  selectedSessionId.value = entry.sessionId
  expandedSessionId.value = entry.sessionId
  isEnteringCatch.value = true
  editingCatchId.value = entry.id
  catchForm.value = {
    time: entry.time,
    speciesId: entry.speciesId,
    lengthCm: entry.lengthCm,
    weightKg: entry.weightKg,
    rodId: entry.rodId,
    baitId: entry.baitId,
    montageId: entry.montageId ?? props.montages[0]?.id ?? '',
    montageWeight: entry.montageWeight ?? 0,
    retained: entry.retained ?? false,
    latitude: entry.latitude,
    longitude: entry.longitude,
    photo: entry.photo ?? '',
    notes: entry.notes ?? ''
  }
}

const deleteCatch = (catchId: string) => {
  const entry = catches.value.find((catchEntry) => catchEntry.id === catchId)
  if (!entry) return

  const fishName = props.species.find((fish) => fish.id === entry.speciesId)?.name ?? 'Unbekannter Fisch'
  if (!window.confirm(`Möchten Sie wirklich den Fang: ${fishName} vom ${formatCatchDate(entry.time)} löschen?`)) return

  catches.value = catches.value.filter((catchEntry) => catchEntry.id !== catchId)
  if (editingCatchId.value === catchId) cancelCatchEdit()
  emit('save')
}

const cancelCatchEdit = () => {
  editingCatchId.value = null
  catchForm.value = createCatchForm()
  isEnteringCatch.value = false
}
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title is-4">Touren</h1>
      <button v-if="!isCreatingTour" class="button is-primary mb-4" type="button" @click="openNewTourForm">
        Neue Tour
      </button>
      <FishingEventForm
        v-if="isCreatingTour"
        v-model="sessionForm"
        :waters="waters"
        heading="Tour erfassen"
        submit-label="Tour speichern"
        :show-cancel="true"
        @submit="saveTour"
        @cancel="cancelTourForm"
      />
      <p v-if="tourMessage" class="help is-danger mb-3" role="alert">{{ tourMessage }}</p>
      <h2 class="subtitle is-5">Alle Touren</h2>
      <p v-if="sortedSessions.length === 0" class="has-text-grey">Noch keine Touren erfasst.</p>
      <div v-else class="tour-list">
        <article v-for="session in sortedSessions" :key="session.id" class="tour-item">
          <div class="tour-heading">
            <button class="tour-toggle" type="button" :aria-expanded="expandedSessionId === session.id" @click="toggleTour(session.id)">
              <span class="tour-heading-text">
                <strong>{{ waters.find((water) => water.id === session.waterId)?.name ?? 'Unbekanntes Gewässer' }}</strong>
                <span>{{ formatCatchDate(session.from) }}{{ session.to ? '' : ' · Aktiv' }}</span>
                <span>{{ catchesForSession(session.id).length }} Fänge</span>
              </span>
              <span class="tour-chevron" aria-hidden="true">{{ expandedSessionId === session.id ? '−' : '+' }}</span>
            </button>
            <button class="button is-primary is-light tour-add-catch" type="button" aria-label="Fang zu dieser Tour hinzufügen" title="Fang hinzufügen" @click="addCatchToTour(session.id)">
              🐟
            </button>
            <button class="button is-light tour-edit" type="button" :aria-label="`Tour am ${formatCatchDate(session.from)} bearbeiten`" title="Tour bearbeiten" @click="editTour(session)">
              <span aria-hidden="true">✎</span>
            </button>
            <button v-if="catchesForSession(session.id).length === 0" class="button is-danger is-light tour-delete" type="button" :aria-label="`Tour am ${formatCatchDate(session.from)} löschen`" title="Tour löschen" @click="deleteTour(session.id)">
              🗑
            </button>
          </div>

          <div v-if="expandedSessionId === session.id" class="tour-details">
            <FishingEventForm
              v-if="editingSessionId === session.id"
              v-model="sessionForm"
              :waters="waters"
              heading="Tour bearbeiten"
              submit-label="Tour speichern"
              :show-cancel="true"
              @submit="saveTour"
              @cancel="cancelTourForm"
            />
            <p v-if="catchesForSession(session.id).length === 0" class="has-text-grey">
              Für diese Tour sind noch keine Fänge erfasst.
            </p>
            <div v-for="entry in catchesForSession(session.id)" :key="entry.id" class="catch-row">
              <span>
                {{ species.find((fish) => fish.id === entry.speciesId)?.name ?? 'Unbekannter Fisch' }} ·
                {{ entry.lengthCm }} cm ·
                {{ baits.find((bait) => bait.id === entry.baitId)?.name ?? 'Unbekannter Köder' }}
              </span>
              <div class="buttons are-small">
                <button class="button is-light" type="button" @click="editCatch(entry.id)">Bearbeiten</button>
                <button class="button is-danger is-light" type="button" @click="deleteCatch(entry.id)">Löschen</button>
              </div>
            </div>
            <CatchView
              v-if="isEnteringCatch && selectedSessionId === session.id && selectedSession"
              v-model="catchForm"
              :waters="waters"
              :species="species"
              :rods="rods"
              :baits="baits"
              :montages="montages"
              :catches="catchesForSelectedSession"
              :session="selectedSession"
              :editing-catch-id="editingCatchId"
              :show-catch-list="false"
              @submit="saveCatch"
              @edit="editCatch"
              @delete="deleteCatch"
              @cancel-edit="cancelCatchEdit"
            />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.catch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.tour-list {
  display: grid;
  gap: 0.75rem;
}

.tour-item {
  overflow: hidden;
  border: 1px solid #d5e0eb;
  border-radius: 12px;
  background: #fff;
}

@media (prefers-color-scheme: dark) {
  .tour-item {
    background: #1f2937;
  }
}

.tour-heading {
  display: flex;
  align-items: stretch;
}

.tour-toggle {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 0;
  padding: 1rem;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.tour-heading-text {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem 1rem;
}

.tour-chevron {
  flex: none;
  font-size: 1.5rem;
  line-height: 1;
}

.tour-add-catch {
  align-self: center;
  flex: none;
  min-width: 2.5rem;
  margin: 0 0.75rem;
  font-size: 1.25rem;
}

.tour-edit,
.tour-delete {
  align-self: center;
  flex: none;
  min-width: 2.5rem;
  margin-right: 0.75rem;
  font-size: 1.1rem;
}

.tour-details {
  padding: 0 1rem 1rem;
}

@media (max-width: 600px) {
  .catch-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .tour-heading-text {
    flex-direction: column;
    gap: 0.2rem;
  }
}
</style>