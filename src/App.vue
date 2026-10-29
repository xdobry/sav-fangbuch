<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
  Montage,
  MontageForm,
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
  { id: 'aal', name: 'Aal' },
  { id: 'aland', name: 'Aland' },
  { id: 'aeschе', name: 'Äsche' },
  { id: 'bachforelle', name: 'Bachforelle' },
  { id: 'bachneunauge', name: 'Bachneunauge' },
  { id: 'bachsaibling', name: 'Bachsaibling' },
  { id: 'barbe', name: 'Barbe' },
  { id: 'bitterling', name: 'Bitterling' },
  { id: 'brasse', name: 'Brasse' },
  { id: 'doebel', name: 'Döbel' },
  { id: 'dreistachliger-stichling', name: 'Dreistachliger Stichling' },
  { id: 'elritze', name: 'Elritze' },
  // { id: 'flunder', name: 'Flunder' },
  { id: 'flussbarsch', name: 'Flussbarsch' },
  //{ id: 'flussneunauge', name: 'Flussneunauge' },
  { id: 'giebel', name: 'Giebel' },
  { id: 'groesse', name: 'Groppe (Mühlkoppe)' },
  { id: 'gruendling', name: 'Gründling' },
  { id: 'guester', name: 'Güster' },
  { id: 'hasel', name: 'Hasel' },
  { id: 'hecht', name: 'Hecht' },
  { id: 'kabeljau', name: 'Kabeljau (Dorsch)' },
  { id: 'kaulbarsch', name: 'Kaulbarsch' },
  { id: 'karausche', name: 'Karausche' },
  { id: 'karpfen', name: 'Wildkarpfen' },
  { id: 'kessler-grundel', name: 'Kessler-Grundel' },
  { id: 'lachs', name: 'Lachs' },
  { id: 'maifisch', name: 'Maifisch' },
  // { id: 'makrele', name: 'Makrele' },
  // { id: 'meerforelle', name: 'Meerforelle' },
  { id: 'moderlieschen', name: 'Moderlieschen' },
  { id: 'nase', name: 'Nase' },
  { id: 'nordseeschnaepel', name: 'Nordseeschnäpel' },
  { id: 'quappe', name: 'Quappe (Rutte)' },
  { id: 'rapfen', name: 'Rapfen' },
  { id: 'regenbogenforelle', name: 'Regenbogenforelle' },
  { id: 'rotauge', name: 'Rotauge' },
  { id: 'rotfeder', name: 'Rotfeder' },
  { id: 'schlammpeitzger', name: 'Schlammpeitzger' },
  { id: 'schleie', name: 'Schleie' },
  { id: 'schmerle', name: 'Schmerle' },
  { id: 'schneider', name: 'Schneider' },
  { id: 'steinbeisser', name: 'Steinbeißer' },
  { id: 'ukelei', name: 'Ukelei (Laube)' },
  { id: 'wels', name: 'Wels' },
  { id: 'zander', name: 'Zander' },
  { id: 'zaehrte', name: 'Zährte' },
  { id: 'zwergstichling', name: 'Zwergstichling' },
]

const defaultWaters: Water[] = [
  { id: 'autobahnweiher', name: 'Autobahnweiher', location: 'Leverkusen', 
      latitude: 51.017875417026495, longitude: 7.01031190443649250  },
  { id: 'grosse-ledder', name: 'Große Ledder', location: 'Leverkusen', latitude: 51.099071375174255, longitude: 7.232025280344614 },
  { id: 'grosser-silbersee', name: 'Großer Silbersee', location: 'Leverkusen', latitude: 51.07135766552641, longitude: 6.9336335602489845 },
  { id: 'hitdorfersee-nord', name: 'Hitdorfersee Nord', location: 'Leverkusen', latitude: 51.07232842931969, longitude: 6.931144470033943 },
  { id: 'kleiner-dehlensee', name: 'Kleiner Dehlensee', location: 'Leverkusen', latitude: 51.06079991045928, longitude:  6.9406035532901384 },
  { id: 'rheinhafen-hitdorf', name: 'Rheinhafen Hitdorf', location: 'Leverkusen', latitude: 51.06024636334001, longitude: 6.913463348581607 },
  { id: 'stoeckenbergsee', name: 'Stöckenbergsee', location: 'Leverkusen', latitude: 51.04701564905807, longitude: 7.0097765516169375 },
  { id: 'wupper', name: 'Wupper', location: 'Leverkusen', latitude: 51.03663340599309, longitude: 7.001051754417278 }
]

const defaultRods: Rod[] = [
  { id: 'rod-1', type: 'Teleskop', length: 3.9 },
  { id: 'rod-2', type: 'Feeder', length: 4.2 },
  { id: 'rod-3', type: 'Karpfenrute', length: 4.8 }
]

const defaultBaits: Bait[] = [
  { id: 'bait-1', name: 'Spinner', kind: 'Kunstköder' },
  { id: 'bait-2', name: 'Wobbler', kind: 'Kunstköder' },
  { id: 'bait-3', name: 'Gumifisch', kind: 'Kunstköder' },
  { id: 'bait-6', name: 'Blinker', kind: 'Kunstköder' },
  { id: 'bait-7', name: 'Chaterbait', kind: 'Kunstköder' },
  { id: 'bait-8', name: 'Popper', kind: 'Kunstköder' },
  { id: 'bait-9', name: 'Krebs', kind: 'Kunstköder' },
  { id: 'bait-10', name: 'SpinMad', kind: 'Kunstköder' },
  { id: 'bait-4', name: 'Made', kind: 'Lebend' },
  { id: 'bait-5', name: 'Wurm', kind: 'Lebend' },
  { id: 'bait-11', name: 'Popup', kind: 'Organisch' },
  { id: 'bait-12', name: 'Teig', kind: 'Organisch' },
  { id: 'bait-13', name: 'Boily', kind: 'Organisch' },
]

const defaultMontages: Montage[] = [
  { id: 'montage-laufpose', title: 'Laufpose' },
  { id: 'montage-feststellpose', title: 'Feststellpose' },
  { id: 'montage-feeder', title: 'Feeder' },
  { id: 'montage-einfaches-grundblei', title: 'Einfaches Grundblei' },
  { id: 'montage-jig', title: 'Jig' },
  { id: 'montage-flourocarbon', title: 'Flourocarbon' },
  { id: 'montage-stahlvorfach', title: 'Stahlvorfach' },
  { id: 'montage-dropshot', title: 'Dropshot' }
]

const storageKey = 'fangbuch-data-v1'
const getLocalDateTime = (date = new Date()) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
const waters = ref<Water[]>(defaultWaters)
const species = defaultSpecies
const rods = ref<Rod[]>(defaultRods)
const baits = ref<Bait[]>(defaultBaits)
const montages = ref<Montage[]>(defaultMontages)
const sessions = ref<FishingSession[]>([])
const catches = ref<CatchEntry[]>([])

const activeTab = ref<'home' | 'events' | 'masterdata' | 'summary'>('home')
const activeMasterData = ref<'waters' | 'rods' | 'baits' | 'montages'>('waters')
const masterDataItems = [
  { id: 'waters', label: 'Gewässer' },
  { id: 'rods', label: 'Ruten' },
  { id: 'baits', label: 'Köder' },
  { id: 'montages', label: 'Montagen' }
] as const
const selectedSessionId = ref('')
const expandedSessionId = ref('')
const isStartingTour = ref(false)
const isCreatingTour = ref(false)
const editingSessionId = ref<string | null>(null)
const isEnteringCatch = ref(false)
const homeMessage = ref('')
const tourMessage = ref('')
const editingCatchId = ref<string | null>(null)
const editingWaterId = ref<string | null>(null)
const editingRodId = ref<string | null>(null)
const editingBaitId = ref<string | null>(null)
const editingMontageId = ref<string | null>(null)
const waterForm = ref<WaterForm>({ name: '', location: '' })
const waterMessage = ref('')
const gearMessage = ref('')
const baitForm = ref<BaitForm>({ name: '', kind: 'Kunstköder' })
const montageForm = ref<MontageForm>({ title: '' })
const rodForm = ref<RodForm>({ type: 'Teleskop', length: 3.6 })
const sessionForm = ref<FishingSessionForm>({
  from: new Date().toISOString().slice(0, 16),
  to: new Date().toISOString().slice(0, 16),
  temperature: 18,
  population: 50,
  precipitation: 'Kein',
  waterId: defaultWaters[0]?.id ?? ''
})
const latestCatch = () =>
  [...catches.value].sort((first, second) => second.time.localeCompare(first.time))[0]
const createCatchForm = (): CatchForm => {
  const previousCatch = latestCatch()
  return {
    time: new Date().toISOString().slice(0, 16),
    speciesId: previousCatch?.speciesId ?? species[0]?.id ?? '',
    lengthCm: previousCatch?.lengthCm ?? 35,
    weightKg: 1.2,
    rodId: previousCatch?.rodId ?? rods.value[0]?.id ?? '',
    baitId: previousCatch?.baitId ?? baits.value[0]?.id ?? '',
    montageId: previousCatch?.montageId ?? montages.value[0]?.id ?? '',
    montageWeight: 0,
    retained: false,
    photo: '',
    notes: ''
  }
}
const catchForm = ref<CatchForm>(createCatchForm())
const installPrompt = ref<BeforeInstallPromptEvent | null>(null)

const loadData = () => {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw)
    waters.value = parsed.waters?.length ? parsed.waters : defaultWaters
    rods.value = parsed.rods?.length ? parsed.rods : defaultRods
    baits.value = parsed.baits?.length ? parsed.baits : defaultBaits
    const storedMontages: Montage[] = Array.isArray(parsed.montages)
      ? parsed.montages.map(({ id, title }: Montage) => ({ id, title }))
      : []
    const storedMontageIds = new Set(storedMontages.map((montage) => montage.id))
    montages.value = [
      ...storedMontages,
      ...defaultMontages.filter((montage) => !storedMontageIds.has(montage.id))
    ]
    sessions.value = parsed.sessions ?? []
    const loadedCatches = parsed.catches ?? []
    let migratedCatches = false
    const storedSpecies = Object.prototype.hasOwnProperty.call(parsed, 'species')

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
    catchForm.value = createCatchForm()
    if (!catchForm.value.rodId && rods.value[0]) catchForm.value.rodId = rods.value[0].id
    if (!catchForm.value.baitId && baits.value[0]) catchForm.value.baitId = baits.value[0].id
    if (!catchForm.value.montageId && montages.value[0]) catchForm.value.montageId = montages.value[0].id
    if (migratedCatches || storedSpecies) saveData()
  } catch {
    console.warn('Could not parse stored data, falling back to defaults.')
  }
}

const saveData = () => {
  const payload = {
    waters: waters.value,
    rods: rods.value,
    baits: baits.value,
    montages: montages.value,
    sessions: sessions.value,
    catches: catches.value
  }
  localStorage.setItem(storageKey, JSON.stringify(payload))
}

const saveWater = () => {
  if (!waterForm.value.name.trim()) return

  const waterData = {
    name: waterForm.value.name.trim(),
    location: waterForm.value.location.trim(),
    latitude: waterForm.value.latitude,
    longitude: waterForm.value.longitude
  }
  if (editingWaterId.value) {
    const index = waters.value.findIndex((water) => water.id === editingWaterId.value)
    if (index < 0) return
    waters.value[index] = { ...waters.value[index]!, ...waterData }
  } else {
    waters.value.unshift({ id: createId(), ...waterData })
  }
  editingWaterId.value = null
  waterForm.value = { name: '', location: '' }
  waterMessage.value = ''
  saveData()
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

const cancelWaterEdit = () => {
  editingWaterId.value = null
  waterForm.value = { name: '', location: '' }
  waterMessage.value = ''
}

const deleteWater = (waterId: string) => {
  const water = waters.value.find((entry) => entry.id === waterId)
  if (!water) return
  if (sessions.value.some((session) => session.waterId === waterId)) {
    waterMessage.value = 'Dieses Gewässer kann nicht gelöscht werden, da Touren darauf verweisen.'
    return
  }
  if (!window.confirm(`Gewässer „${water.name}“ wirklich löschen?`)) return

  waters.value = waters.value.filter((entry) => entry.id !== waterId)
  if (editingWaterId.value === waterId) cancelWaterEdit()
  if (sessionForm.value.waterId === waterId) sessionForm.value.waterId = waters.value[0]?.id ?? ''
  waterMessage.value = ''
  saveData()
}

const saveBait = () => {
  if (!baitForm.value.name.trim()) return

  const baitData = {
    name: baitForm.value.name.trim(),
    kind: baitForm.value.kind
  }
  if (editingBaitId.value) {
    const index = baits.value.findIndex((bait) => bait.id === editingBaitId.value)
    if (index < 0) return
    baits.value[index] = { ...baits.value[index]!, ...baitData }
  } else {
    baits.value.unshift({ id: createId(), ...baitData })
    catchForm.value.baitId = baits.value[0]?.id ?? ''
  }
  editingBaitId.value = null
  baitForm.value = { name: '', kind: 'Kunstköder' }
  gearMessage.value = ''
  saveData()
}

const editBait = (baitId: string) => {
  const bait = baits.value.find((entry) => entry.id === baitId)
  if (!bait) return
  editingBaitId.value = bait.id
  baitForm.value = { name: bait.name, kind: bait.kind }
  gearMessage.value = ''
}

const cancelBaitEdit = () => {
  editingBaitId.value = null
  baitForm.value = { name: '', kind: 'Kunstköder' }
  gearMessage.value = ''
}

const deleteBait = (baitId: string) => {
  const bait = baits.value.find((entry) => entry.id === baitId)
  if (!bait) return
  if (catches.value.some((entry) => entry.baitId === baitId)) {
    gearMessage.value = 'Dieser Köder kann nicht gelöscht werden, da Fänge darauf verweisen.'
    return
  }
  if (!window.confirm(`Köder „${bait.name}“ wirklich löschen?`)) return

  baits.value = baits.value.filter((entry) => entry.id !== baitId)
  if (editingBaitId.value === baitId) cancelBaitEdit()
  if (catchForm.value.baitId === baitId) catchForm.value.baitId = baits.value[0]?.id ?? ''
  gearMessage.value = ''
  saveData()
}

const saveMontage = () => {
  if (!montageForm.value.title.trim()) return

  const montageData = {
    title: montageForm.value.title.trim()
  }
  if (editingMontageId.value) {
    const index = montages.value.findIndex((montage) => montage.id === editingMontageId.value)
    if (index < 0) return
    montages.value[index] = { ...montages.value[index]!, ...montageData }
  } else {
    montages.value.unshift({ id: createId(), ...montageData })
    catchForm.value.montageId = montages.value[0]?.id ?? ''
  }
  editingMontageId.value = null
  montageForm.value = { title: '' }
  gearMessage.value = ''
  saveData()
}

const editMontage = (montageId: string) => {
  const montage = montages.value.find((entry) => entry.id === montageId)
  if (!montage) return
  editingMontageId.value = montage.id
  montageForm.value = { title: montage.title }
  gearMessage.value = ''
}

const cancelMontageEdit = () => {
  editingMontageId.value = null
  montageForm.value = { title: '' }
  gearMessage.value = ''
}

const deleteMontage = (montageId: string) => {
  const montage = montages.value.find((entry) => entry.id === montageId)
  if (!montage) return
  if (catches.value.some((entry) => entry.montageId === montageId)) {
    gearMessage.value = 'Diese Montage kann nicht gelöscht werden, da Fänge darauf verweisen.'
    return
  }
  if (!window.confirm(`Montage „${montage.title}“ wirklich löschen?`)) return

  montages.value = montages.value.filter((entry) => entry.id !== montageId)
  if (editingMontageId.value === montageId) cancelMontageEdit()
  if (catchForm.value.montageId === montageId) catchForm.value.montageId = montages.value[0]?.id ?? ''
  gearMessage.value = ''
  saveData()
}

const saveRod = () => {
  if (!rodForm.value.type) return

  const rodData = {
    type: rodForm.value.type,
    length: Number(rodForm.value.length) || 3.6
  }
  if (editingRodId.value) {
    const index = rods.value.findIndex((rod) => rod.id === editingRodId.value)
    if (index < 0) return
    rods.value[index] = { ...rods.value[index]!, ...rodData }
  } else {
    rods.value.unshift({ id: createId(), ...rodData })
    catchForm.value.rodId = rods.value[0]?.id ?? ''
  }
  editingRodId.value = null
  rodForm.value = { type: 'Teleskop', length: 3.6 }
  gearMessage.value = ''
  saveData()
}

const editRod = (rodId: string) => {
  const rod = rods.value.find((entry) => entry.id === rodId)
  if (!rod) return
  editingRodId.value = rod.id
  rodForm.value = { type: rod.type, length: rod.length }
  gearMessage.value = ''
}

const cancelRodEdit = () => {
  editingRodId.value = null
  rodForm.value = { type: 'Teleskop', length: 3.6 }
  gearMessage.value = ''
}

const deleteRod = (rodId: string) => {
  const rod = rods.value.find((entry) => entry.id === rodId)
  if (!rod) return
  if (catches.value.some((entry) => entry.rodId === rodId)) {
    gearMessage.value = 'Diese Rute kann nicht gelöscht werden, da Fänge darauf verweisen.'
    return
  }
  if (!window.confirm(`Rute „${rod.type} · ${rod.length} m“ wirklich löschen?`)) return

  rods.value = rods.value.filter((entry) => entry.id !== rodId)
  if (editingRodId.value === rodId) cancelRodEdit()
  if (catchForm.value.rodId === rodId) catchForm.value.rodId = rods.value[0]?.id ?? ''
  gearMessage.value = ''
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
    windSpeed10m: sessionForm.value.windSpeed10m,
    windDirection10m: sessionForm.value.windDirection10m,
    weatherCode: sessionForm.value.weatherCode,
    waterId: sessionForm.value.waterId
  }
  sessions.value.unshift(newSession)
  cancelCatchEdit()
  selectedSessionId.value = newSession.id
  isStartingTour.value = false
  isCreatingTour.value = false
  tourMessage.value = ''
  saveData()
}

const saveActiveTour = () => {
  if (!sessionForm.value.waterId) return

  const sessionIndex = sessions.value.findIndex((session) => session.id === editingSessionId.value)
  if (sessionIndex < 0) return

  sessions.value[sessionIndex] = {
    ...sessions.value[sessionIndex]!,
    from: sessionForm.value.from,
    to: sessionForm.value.to,
    temperature: Number(sessionForm.value.temperature),
    population: Number(sessionForm.value.population),
    precipitation: sessionForm.value.precipitation,
    windSpeed10m: sessionForm.value.windSpeed10m,
    windDirection10m: sessionForm.value.windDirection10m,
    weatherCode: sessionForm.value.weatherCode,
    waterId: sessionForm.value.waterId
  }
  editingSessionId.value = null
  isStartingTour.value = false
  tourMessage.value = ''
  saveData()
}

const startTour = () => {
  const now = getLocalDateTime()
  const today = now.slice(0, 10)
  const previousTourToday = [...sessions.value]
    .filter((session) => session.to && session.from.slice(0, 10) === today)
    .sort((first, second) => second.from.localeCompare(first.from))[0]

  if (previousTourToday) {
    const waterName = waters.value.find((water) => water.id === previousTourToday.waterId)?.name
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
    waterId: sessionForm.value.waterId || waters.value[0]?.id || ''
  }
  editingSessionId.value = null
  tourMessage.value = ''
  homeMessage.value = ''
  isStartingTour.value = true
}

const editActiveTour = () => {
  const session = activeSession.value
  if (!session) return

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
    waterId: session.waterId
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
  if (catches.value.some((entry) => entry.sessionId === session.id)) {
    tourMessage.value = 'Tour hat bereits erfasste Fänge'
    return
  }
  if (!window.confirm('Möchten Sie diese Tour wirklich verwerfen?')) return

  sessions.value = sessions.value.filter((entry) => entry.id !== session.id)
  if (selectedSessionId.value === session.id) selectedSessionId.value = ''
  editingSessionId.value = null
  isStartingTour.value = false
  tourMessage.value = ''
  saveData()
}

const openNewTourForm = () => {
  const now = getLocalDateTime()
  sessionForm.value = {
    ...sessionForm.value,
    from: now,
    to: now,
    waterId: sessionForm.value.waterId || waters.value[0]?.id || ''
  }
  tourMessage.value = ''
  isCreatingTour.value = true
}

const deleteTour = (sessionId: string) => {
  const session = sessions.value.find((entry) => entry.id === sessionId)
  if (!session) return
  if (catches.value.some((entry) => entry.sessionId === sessionId)) {
    tourMessage.value = 'Tour hat bereits erfasste Fänge'
    return
  }

  const waterName = waters.value.find((water) => water.id === session.waterId)?.name ?? 'Unbekanntes Gewässer'
  if (!window.confirm(`Möchten Sie die Tour am ${formatCatchDate(session.from)} am Gewässer „${waterName}“ wirklich löschen?`)) return

  sessions.value = sessions.value.filter((entry) => entry.id !== sessionId)
  if (selectedSessionId.value === sessionId) {
    selectedSessionId.value = ''
    cancelCatchEdit()
  }
  if (expandedSessionId.value === sessionId) expandedSessionId.value = ''
  tourMessage.value = ''
  saveData()
}

const enterCatch = () => {
  let session = activeSession.value
  if (!session) {
    const waterId = sessionForm.value.waterId || waters.value[0]?.id
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
    sessions.value.unshift(session)
    saveData()
  }

  cancelCatchEdit()
  selectedSessionId.value = session.id
  isStartingTour.value = false
  isEnteringCatch.value = true
  homeMessage.value = ''
}

const addCatchToTour = (sessionId: string) => {
  cancelCatchEdit()
  selectedSessionId.value = sessionId
  expandedSessionId.value = sessionId
  catchForm.value.time = getLocalDateTime()
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
  isEnteringCatch.value = false
  saveData()
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
    montageId: entry.montageId ?? montages.value[0]?.id ?? '',
    montageWeight: entry.montageWeight ?? 0,
    retained: entry.retained ?? false,
    latitude: entry.latitude,
    longitude: entry.longitude,
    photo: entry.photo ?? '',
    notes: entry.notes ?? ''
  }
}

const deleteCatch = (catchId: string) => {
  const index = catches.value.findIndex((entry) => entry.id === catchId)
  if (index < 0) return

  const entry = catches.value[index]!
  const fishName = species.find((fish) => fish.id === entry.speciesId)?.name ?? 'Unbekannter Fisch'
  if (!window.confirm(`Möchten Sie wirklich den Fang: ${fishName} vom ${formatCatchDate(entry.time)} löschen?`)) return

  catches.value.splice(index, 1)
  if (editingCatchId.value === catchId) cancelCatchEdit()
  saveData()
}

const cancelCatchEdit = () => {
  editingCatchId.value = null
  catchForm.value = createCatchForm()
  isEnteringCatch.value = false
}

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

const openMasterData = (section: typeof activeMasterData.value) => {
  activeMasterData.value = section
  activeTab.value = 'masterdata'
}

const selectedSession = computed(() =>
  sessions.value.find((session) => session.id === selectedSessionId.value) ?? null
)
const activeSession = computed(() => sessions.value.find((session) => !session.to) ?? null)
const activeSessionWaterName = computed(() =>
  waters.value.find((water) => water.id === activeSession.value?.waterId)?.name ?? 'Unbekanntes Gewässer'
)
const activeGearSection = computed<'rods' | 'baits' | 'montages'>(() =>
  activeMasterData.value === 'waters' ? 'rods' : activeMasterData.value
)
const catchesForSelectedSession = computed(() =>
  catches.value.filter((entry) => entry.sessionId === selectedSessionId.value)
)
const catchesForSession = (sessionId: string) =>
  catches.value
    .filter((entry) => entry.sessionId === sessionId)
    .sort((first, second) => second.time.localeCompare(first.time))
const sortedSessions = computed(() =>
  [...sessions.value].sort((first, second) => second.from.localeCompare(first.from))
)
const latestCatches = computed(() =>
  [...catches.value]
    .sort((first, second) => second.time.localeCompare(first.time))
    .slice(0, 10)
)
const formatCatchDate = (time: string) => {
  const date = new Date(time)
  return Number.isNaN(date.getTime()) ? time : date.toLocaleDateString('de-DE')
}
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
          <button
            class="navbar-item button is-primary is-inverted is-light"
            :class="{ 'is-selected': activeTab === 'home' }"
            @click="activeTab = 'home'"
          >
            Start
          </button>
          <button
            class="navbar-item button is-primary is-inverted is-light"
            :class="{ 'is-selected': activeTab === 'events' }"
            @click="activeTab = 'events'"
          >
            Touren
          </button>
          <div class="masterdata-menu">
            <button
              class="navbar-item button is-primary is-inverted is-light"
              :aria-expanded="activeTab === 'masterdata'"
              @click="openMasterData(activeMasterData)"
            >
              Stammdaten
            </button>
            <div v-if="activeTab === 'masterdata'" class="masterdata-submenu" aria-label="Stammdaten">
              <button
                v-for="item in masterDataItems"
                :key="item.id"
                class="navbar-item button is-primary is-inverted is-light"
                :class="{ 'is-selected': activeMasterData === item.id }"
                @click="openMasterData(item.id)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
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
      <section v-if="activeTab === 'home'" class="section">
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
                <button class="button is-light" type="button" @click="editActiveTour">Tour bearbeiten</button>
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
            :waters="waters"
            :heading="editingSessionId ? 'Tour bearbeiten' : 'Tour starten'"
            :submit-label="editingSessionId ? 'Tour speichern' : 'Tour starten'"
            :show-cancel="true"
            @submit="editingSessionId ? saveActiveTour() : addFishingSession()"
            @cancel="cancelTourForm"
          />

          <div class="box">
            <button class="button is-link" type="button" @click="enterCatch">Fang erfassen</button>
            <p v-if="homeMessage" class="help is-danger mt-2" role="alert">{{ homeMessage }}</p>
          </div>

          <CatchView
            v-if="isEnteringCatch && selectedSession"
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
            :show-cancel="true"
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

      <section v-else-if="activeTab === 'events'" class="section">
        <div class="container">
          <h1 class="title is-4">Touren</h1>
          <button
            v-if="!isCreatingTour"
            class="button is-primary mb-4"
            type="button"
            @click="openNewTourForm"
          >
            Neue Tour
          </button>
          <FishingEventForm
            v-if="isCreatingTour"
            v-model="sessionForm"
            :waters="waters"
            heading="Tour erfassen"
            submit-label="Tour speichern"
            :show-cancel="true"
            @submit="addFishingSession"
            @cancel="isCreatingTour = false"
          />
          <p v-if="tourMessage" class="help is-danger mb-3" role="alert">{{ tourMessage }}</p>
          <h2 class="subtitle is-5">Alle Touren</h2>
          <p v-if="sortedSessions.length === 0" class="has-text-grey">Noch keine Touren erfasst.</p>
          <div v-else class="tour-list">
            <article v-for="session in sortedSessions" :key="session.id" class="tour-item">
              <div class="tour-heading">
                <button
                  class="tour-toggle"
                  type="button"
                  :aria-expanded="expandedSessionId === session.id"
                  @click="toggleTour(session.id)"
                >
                  <span class="tour-heading-text">
                    <strong>{{ waters.find((water) => water.id === session.waterId)?.name ?? 'Unbekanntes Gewässer' }}</strong>
                    <span>{{ formatCatchDate(session.from) }}{{ session.to ? '' : ' · Aktiv' }}</span>
                    <span>{{ catchesForSession(session.id).length }} Fänge</span>
                  </span>
                  <span class="tour-chevron" aria-hidden="true">{{ expandedSessionId === session.id ? '−' : '+' }}</span>
                </button>
                <button
                  class="button is-primary is-light tour-add-catch"
                  type="button"
                  :aria-label="`Fang zu dieser Tour hinzufügen`"
                  title="Fang hinzufügen"
                  @click="addCatchToTour(session.id)"
                >
                  🐟
                </button>
                <button
                  v-if="catchesForSession(session.id).length === 0"
                  class="button is-danger is-light tour-delete"
                  type="button"
                  :aria-label="`Tour am ${formatCatchDate(session.from)} löschen`"
                  title="Tour löschen"
                  @click="deleteTour(session.id)"
                >
                  🗑
                </button>
              </div>

              <div v-if="expandedSessionId === session.id" class="tour-details">
                <p v-if="catchesForSession(session.id).length === 0" class="has-text-grey">
                  Für diese Tour sind noch keine Fänge erfasst.
                </p>
                <div
                  v-for="entry in catchesForSession(session.id)"
                  :key="entry.id"
                  class="catch-row"
                >
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

      <WaterView
        v-else-if="activeTab === 'masterdata' && activeMasterData === 'waters'"
        v-model="waterForm"
        :waters="waters"
        :editing-water-id="editingWaterId"
        :message="waterMessage"
        @submit="saveWater"
        @edit="editWater"
        @delete="deleteWater"
        @cancel-edit="cancelWaterEdit"
      />

      <GearView
        v-else-if="activeTab === 'masterdata'"
        v-model:bait-form="baitForm"
        v-model:montage-form="montageForm"
        v-model:rod-form="rodForm"
        :section="activeGearSection"
        :editing-bait-id="editingBaitId"
        :editing-montage-id="editingMontageId"
        :editing-rod-id="editingRodId"
        :message="gearMessage"
        :baits="baits"
        :montages="montages"
        :rods="rods"
        @save-bait="saveBait"
        @edit-bait="editBait"
        @delete-bait="deleteBait"
        @cancel-bait-edit="cancelBaitEdit"
        @save-montage="saveMontage"
        @edit-montage="editMontage"
        @delete-montage="deleteMontage"
        @cancel-montage-edit="cancelMontageEdit"
        @save-rod="saveRod"
        @edit-rod="editRod"
        @delete-rod="deleteRod"
        @cancel-rod-edit="cancelRodEdit"
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

.masterdata-menu {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.masterdata-submenu {
  display: flex;
  flex-wrap: wrap;
  padding-left: 0.5rem;
  border-left: 1px solid rgba(255, 255, 255, 0.45);
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
