<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import CatchView from './components/CatchView.vue'
import FishingEventForm from './components/FishingEventForm.vue'
import GearView from './components/GearView.vue'
import SummaryView from './components/SummaryView.vue'
import WaterView from './components/WaterView.vue'
import { createId } from './utils/createId'
import type {
  Bait,
  BaitForm,
  CatchEntry,
  CatchForm,
  FishSpecies,
  FishingSession,
  FishingSessionForm,
  Rod,
  RodForm,
  Water,
  WaterForm
} from './types'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const defaultSpecies: FishSpecies[] = [
  { id: 'rotauge', name: 'Rotauge' },
  { id: 'sander', name: 'Sander' },
  { id: 'hecht', name: 'Hecht' },
  { id: 'barsch', name: 'Barsch' },
  { id: 'karpfen', name: 'Karpfen' },
  { id: 'zander', name: 'Zander' }
]

const defaultWaters: Water[] = [
  { id: 'autobahnweiher', name: 'Autobahnweiher', location: '' },
  { id: 'grosse-ledder', name: 'Große Ledder', location: '' },
  { id: 'grosser-silbersee', name: 'Großer Silbersee', location: '' },
  { id: 'hitdorfersee-nord', name: 'Hitdorfersee Nord', location: '' },
  { id: 'kleiner-dehlensee', name: 'Kleiner Dehlensee', location: '' },
  { id: 'rheinhafen-hitdorf', name: 'Rheinhafen Hitdorf', location: '' },
  { id: 'stoeckenbergsee', name: 'Stöckenbergsee', location: '' },
  { id: 'wupper', name: 'Wupper', location: '' }
]

const defaultRods: Rod[] = [
  { id: 'rod-1', type: 'Teleskop', length: 3.9 },
  { id: 'rod-2', type: 'Feeder', length: 4.2 },
  { id: 'rod-3', type: 'Karpfenrute', length: 4.8 }
]

const defaultBaits: Bait[] = [
  { id: 'bait-1', category: 'Köder', name: 'Spinner', kind: 'Kunstköder' },
  { id: 'bait-2', category: 'Köder', name: 'Wobbler', kind: 'Kunstköder' },
  { id: 'bait-3', category: 'Köder', name: 'Gumifisch', kind: 'Kunstköder' },
  { id: 'bait-4', category: 'Köder', name: 'Made', kind: 'Lebend' },
  { id: 'bait-5', category: 'Vorfach', name: 'Vorfach', kind: 'Lebend' },
  { id: 'bait-6', category: 'Haken', name: 'Haken 3/0', kind: 'Lebend' }
]

const storageKey = 'fangbuch-data-v1'
const waters = ref<Water[]>(defaultWaters)
const species = ref<FishSpecies[]>(defaultSpecies)
const rods = ref<Rod[]>(defaultRods)
const baits = ref<Bait[]>(defaultBaits)
const sessions = ref<FishingSession[]>([])
const catches = ref<CatchEntry[]>([])

const activeTab = ref<'events' | 'waters' | 'gear' | 'summary'>('events')
const selectedSessionId = ref('')
const editingCatchId = ref<string | null>(null)
const waterForm = ref<WaterForm>({ name: '', location: '' })
const baitForm = ref<BaitForm>({ name: '', kind: 'Kunstköder', category: 'Köder' })
const rodForm = ref<RodForm>({ type: 'Teleskop', length: 3.6 })
const sessionForm = ref<FishingSessionForm>({
  from: new Date().toISOString().slice(0, 16),
  to: new Date().toISOString().slice(0, 16),
  temperature: 18,
  population: 50,
  precipitation: 'Kein',
  waterId: defaultWaters[0]?.id ?? ''
})
const createCatchForm = (): CatchForm => ({
  time: new Date().toISOString().slice(0, 16),
  speciesId: species.value[0]?.id ?? '',
  lengthCm: 35,
  weightKg: 1.2,
  rodId: rods.value[0]?.id ?? '',
  baitId: baits.value[0]?.id ?? '',
  photo: '',
  notes: ''
})
const catchForm = ref<CatchForm>(createCatchForm())
const installPrompt = ref<BeforeInstallPromptEvent | null>(null)

const loadData = () => {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw)
    waters.value = parsed.waters?.length ? parsed.waters : defaultWaters
    species.value = parsed.species?.length ? parsed.species : defaultSpecies
    rods.value = parsed.rods?.length ? parsed.rods : defaultRods
    baits.value = parsed.baits?.length ? parsed.baits : defaultBaits
    sessions.value = parsed.sessions ?? []
    const loadedCatches = parsed.catches ?? []
    let migratedCatches = false

    catches.value = loadedCatches.map((entry: CatchEntry & { waterId?: string }) => {
      if (entry.sessionId && sessions.value.some((session) => session.id === entry.sessionId)) return entry

      const matchingSession = sessions.value.find((session) =>
        session.waterId === entry.waterId && entry.time >= session.from && entry.time <= session.to
      )
      if (matchingSession) {
        migratedCatches = true
        return { ...entry, sessionId: matchingSession.id }
      }

      const waterId = waters.value.find((water) => water.id === entry.waterId)?.id
        ?? waters.value[0]?.id
        ?? ''
      const time = entry.time || new Date().toISOString().slice(0, 16)
      const migratedSession: FishingSession = {
        id: createId(),
        from: time,
        to: time,
        temperature: 0,
        population: 0,
        precipitation: 'Kein',
        waterId
      }
      sessions.value.unshift(migratedSession)
      migratedCatches = true
      return { ...entry, sessionId: migratedSession.id }
    })

    if (!sessionForm.value.waterId && waters.value[0]) sessionForm.value.waterId = waters.value[0].id
    if (!catchForm.value.speciesId && species.value[0]) catchForm.value.speciesId = species.value[0].id
    if (!catchForm.value.rodId && rods.value[0]) catchForm.value.rodId = rods.value[0].id
    if (!catchForm.value.baitId && baits.value[0]) catchForm.value.baitId = baits.value[0].id
    if (migratedCatches) saveData()
  } catch {
    console.warn('Could not parse stored data, falling back to defaults.')
  }
}

const saveData = () => {
  const payload = {
    waters: waters.value,
    species: species.value,
    rods: rods.value,
    baits: baits.value,
    sessions: sessions.value,
    catches: catches.value
  }
  localStorage.setItem(storageKey, JSON.stringify(payload))
}

const addWater = () => {
  if (!waterForm.value.name.trim() || !waterForm.value.location.trim()) return

  waters.value.unshift({
    id: createId(),
    name: waterForm.value.name.trim(),
    location: waterForm.value.location.trim()
  })
  waterForm.value = { name: '', location: '' }
  saveData()
}

const addBait = () => {
  if (!baitForm.value.name.trim()) return

  baits.value.unshift({
    id: createId(),
    category: baitForm.value.category,
    name: baitForm.value.name.trim(),
    kind: baitForm.value.kind
  })
  baitForm.value = { name: '', kind: 'Kunstköder', category: 'Köder' }
  catchForm.value.baitId = baits.value[0]?.id ?? ''
  saveData()
}

const addRod = () => {
  if (!rodForm.value.type) return

  rods.value.unshift({
    id: createId(),
    type: rodForm.value.type,
    length: Number(rodForm.value.length) || 3.6
  })
  rodForm.value = { type: 'Teleskop', length: 3.6 }
  catchForm.value.rodId = rods.value[0]?.id ?? ''
  saveData()
}

const addFishingSession = () => {
  if (!sessionForm.value.waterId) return

  const newSession: FishingSession = {
    id: createId(),
    from: sessionForm.value.from,
    to: sessionForm.value.to,
    temperature: Number(sessionForm.value.temperature),
    population: Number(sessionForm.value.population),
    precipitation: sessionForm.value.precipitation,
    waterId: sessionForm.value.waterId
  }
  sessions.value.unshift(newSession)
  selectedSessionId.value = newSession.id
  saveData()
}

const saveCatch = () => {
  if (!selectedSessionId.value || !catchForm.value.speciesId || !catchForm.value.rodId || !catchForm.value.baitId) return

  const catchData = {
    time: catchForm.value.time,
    speciesId: catchForm.value.speciesId,
    lengthCm: Number(catchForm.value.lengthCm),
    weightKg: catchForm.value.weightKg ? Number(catchForm.value.weightKg) : undefined,
    rodId: catchForm.value.rodId,
    baitId: catchForm.value.baitId,
    photo: catchForm.value.photo,
    notes: catchForm.value.notes
  }

  if (editingCatchId.value) {
    const index = catches.value.findIndex((entry) => entry.id === editingCatchId.value)
    if (index < 0) return
    catches.value[index] = {
      ...catches.value[index]!,
      ...catchData
    }
  } else {
    catches.value.unshift({
      id: createId(),
      sessionId: selectedSessionId.value,
      ...catchData
    })
  }

  cancelCatchEdit()
  saveData()
}

const editCatch = (catchId: string) => {
  const entry = catches.value.find((catchEntry) => catchEntry.id === catchId)
  if (!entry || entry.sessionId !== selectedSessionId.value) return

  editingCatchId.value = entry.id
  catchForm.value = {
    time: entry.time,
    speciesId: entry.speciesId,
    lengthCm: entry.lengthCm,
    weightKg: entry.weightKg,
    rodId: entry.rodId,
    baitId: entry.baitId,
    photo: entry.photo ?? '',
    notes: entry.notes ?? ''
  }
}

const deleteCatch = (catchId: string) => {
  const index = catches.value.findIndex((entry) =>
    entry.id === catchId && entry.sessionId === selectedSessionId.value
  )
  if (index < 0) return

  catches.value.splice(index, 1)
  if (editingCatchId.value === catchId) cancelCatchEdit()
  saveData()
}

const cancelCatchEdit = () => {
  editingCatchId.value = null
  catchForm.value = createCatchForm()
}

watch(selectedSessionId, cancelCatchEdit)

const onBeforeInstallPrompt = (event: Event) => {
  event.preventDefault()
  installPrompt.value = event as BeforeInstallPromptEvent
}

const onAppInstalled = () => {
  installPrompt.value = null
}

const installApp = async () => {
  if (!installPrompt.value) return

  const prompt = installPrompt.value
  try {
    await prompt.prompt()
    await prompt.userChoice
  } catch (error) {
    console.error('Die Installation des Fangbuchs konnte nicht gestartet werden.', error)
  } finally {
    installPrompt.value = null
  }
}

const selectedSession = computed(() =>
  sessions.value.find((session) => session.id === selectedSessionId.value) ?? null
)
const catchesForSelectedSession = computed(() =>
  catches.value.filter((entry) => entry.sessionId === selectedSessionId.value)
)
const totalCatches = computed(() => catches.value.length)
const totalWeight = computed(() => catches.value.reduce((sum, entry) => sum + (entry.weightKg ?? 0), 0))
const biggestCatch = computed(() => {
  if (!catches.value.length) return null
  return [...catches.value].sort((a, b) => b.lengthCm - a.lengthCm)[0] ?? null
})

onMounted(() => {
  loadData()
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
})
</script>

<template>
  <div class="app-shell">
    <nav class="navbar is-primary" role="navigation" aria-label="main navigation">
      <div class="navbar-menu is-active">
        <div class="navbar-start">
          <button class="navbar-item button is-primary is-inverted is-light" @click="activeTab = 'events'">Ereignisse</button>
          <button class="navbar-item button is-primary is-inverted is-light" @click="activeTab = 'waters'">Gewässer</button>
          <button class="navbar-item button is-primary is-inverted is-light" @click="activeTab = 'gear'">Köder &amp; Ruten</button>
          <button class="navbar-item button is-primary is-inverted is-light" @click="activeTab = 'summary'">Übersicht</button>
          <button
            v-if="installPrompt"
            class="navbar-item button is-primary is-inverted is-light"
            type="button"
            @click="installApp"
          >
            App installieren
          </button>
        </div>
      </div>
    </nav>

    <main class="page-content">
      <section v-if="activeTab === 'events'" class="section">
        <div class="container">
          <h1 class="title is-4">Angelereignis</h1>
          <FishingEventForm v-model="sessionForm" :waters="waters" @submit="addFishingSession" />
          <div class="box">
            <h2 class="subtitle is-6">Fänge zu einem Angelereignis erfassen</h2>
            <div v-if="sessions.length === 0" class="has-text-grey">
              Speichere zuerst ein Angelereignis. Fänge können danach diesem Ereignis zugeordnet werden.
            </div>
            <div v-else>
              <label class="label" for="session-select">Angelereignis auswählen</label>
              <div class="select is-fullwidth">
                <select id="session-select" v-model="selectedSessionId">
                  <option value="" disabled>Angelereignis auswählen</option>
                  <option v-for="session in sessions" :key="session.id" :value="session.id">
                    {{ session.from }} · {{ waters.find((water) => water.id === session.waterId)?.name ?? 'Unbekanntes Gewässer' }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <CatchView
            v-if="selectedSession"
            v-model="catchForm"
            :waters="waters"
            :species="species"
            :rods="rods"
            :baits="baits"
            :catches="catchesForSelectedSession"
            :session="selectedSession"
            :editing-catch-id="editingCatchId"
            @submit="saveCatch"
            @edit="editCatch"
            @delete="deleteCatch"
            @cancel-edit="cancelCatchEdit"
          />
        </div>
      </section>

      <WaterView
        v-else-if="activeTab === 'waters'"
        v-model="waterForm"
        :waters="waters"
        @submit="addWater"
      />

      <GearView
        v-else-if="activeTab === 'gear'"
        v-model:bait-form="baitForm"
        v-model:rod-form="rodForm"
        :baits="baits"
        :rods="rods"
        @add-bait="addBait"
        @add-rod="addRod"
      />

      <SummaryView
        v-else
        :total-catches="totalCatches"
        :total-weight="totalWeight"
        :biggest-catch="biggestCatch"
        :sessions="sessions"
        :catches="catches"
        :waters="waters"
        :species="species"
        :rods="rods"
        :baits="baits"
      />
    </main>
  </div>
</template>

<style scoped>
:global(body) {
  background: #edf6ff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-shell {
  min-height: 100vh;
}

.page-content {
  padding-bottom: 3rem;
}

.navbar-item.button {
  height: auto;
  margin: 0.25rem;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  font-size: 0.875rem;
  line-height: 1.2;
}

.navbar-menu.is-active,
.navbar-start {
  display: flex;
  flex-wrap: wrap;
}

.navbar-menu.is-active {
  padding: 0.25rem;
}

.box {
  border-radius: 16px;
}

.content ul {
  margin-left: 1.25rem;
}
</style>
