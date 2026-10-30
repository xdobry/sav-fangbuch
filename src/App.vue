<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import CatchView from './components/CatchView.vue'
import FishingEventForm from './components/FishingEventForm.vue'
import GearView from './components/GearView.vue'
import SummaryView from './components/SummaryView.vue'
import WaterView from './components/WaterView.vue'
import { useFangbuchData } from './composables/useFangbuchData'
import { useWaterData } from './composables/useWaterData.ts'
import { defaultSpecies } from './data/defaults'
import { exportCsvFile, exportJsonFile, importJsonData } from './services/importExport'
import { readPhotoMetadata } from './services/photoMetadata'
import { extendSessionToCatch, planPhotoSession } from './services/photoSession'
import { createId } from './utils/createId'
import type {
  BaitForm,
  CatchForm,
  FishingSession,
  FishingSessionForm,
  MontageForm,
  PhotoMetadata,
  RodForm,
} from './types'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const getLocalDateTime = (date = new Date()) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
const { data, applyData, loadData: loadFangbuchData, saveData } = useFangbuchData()
const species = defaultSpecies

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
const dataMessage = ref('')
const photoInput = ref<HTMLInputElement | null>(null)
const isReadingPhoto = ref(false)
const photoMessage = ref('')
const photoError = ref('')
const isPhotoCatch = ref(false)
const pendingPhoto = ref<PhotoMetadata | null>(null)
const photoTourForm = ref<FishingSessionForm | null>(null)
const editingCatchId = ref<string | null>(null)
const editingRodId = ref<string | null>(null)
const editingBaitId = ref<string | null>(null)
const editingMontageId = ref<string | null>(null)
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
  waterId: data.value.waters[0]?.id ?? ''
})
const waters = computed({
  get: () => data.value.waters,
  set: (nextWaters) => {
    data.value.waters = nextWaters
  }
})
const {
  waterForm,
  editingWaterId,
  waterMessage,
  editWater,
  cancelWaterEdit,
} = useWaterData(waters)

const latestCatch = () =>
  [...data.value.catches].sort((first, second) => second.time.localeCompare(first.time))[0]
const createCatchForm = (): CatchForm => {
  const previousCatch = latestCatch()
  return {
    time: new Date().toISOString().slice(0, 16),
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
const installPrompt = ref<BeforeInstallPromptEvent | null>(null)

const loadData = () => {
  try {
    if (!loadFangbuchData()) return

    if (!sessionForm.value.waterId && data.value.waters[0]) sessionForm.value.waterId = data.value.waters[0].id
    catchForm.value = createCatchForm()
    if (!catchForm.value.rodId && data.value.rods[0]) catchForm.value.rodId = data.value.rods[0].id
    if (!catchForm.value.baitId && data.value.baits[0]) catchForm.value.baitId = data.value.baits[0].id
    if (!catchForm.value.montageId && data.value.montages[0]) catchForm.value.montageId = data.value.montages[0].id
  } catch {
    console.warn('Could not parse stored data, falling back to defaults.')
  }
}

const exportJson = () => {
  exportJsonFile(data.value)
  dataMessage.value = 'JSON-Export wurde heruntergeladen.'
}

const exportCsv = () => {
  exportCsvFile(data.value, species)
  dataMessage.value = 'CSV-Export wurde heruntergeladen.'
}

const importData = async (file: File) => {
  dataMessage.value = ''
  try {
    const imported = importJsonData(await file.text(), data.value)
    applyData(imported.data)
    saveData()
    dataMessage.value = `${imported.addedSessions} Tour(en) und ${imported.addedCatches} Fang/Fänge importiert. Vorhandene Datensätze wurden beibehalten.`
  } catch (error) {
    dataMessage.value = error instanceof Error
      ? `Import fehlgeschlagen: ${error.message}`
      : 'Import fehlgeschlagen: Die Datei konnte nicht gelesen werden.'
  }
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
    const index = data.value.waters.findIndex((water) => water.id === editingWaterId.value)
    if (index < 0) return
    data.value.waters[index] = { ...data.value.waters[index]!, ...waterData }
  } else {
    data.value.waters.unshift({ id: createId(), ...waterData })
  }
  editingWaterId.value = null
  waterForm.value = { name: '', location: '' }
  waterMessage.value = ''
  saveData()
}

const deleteWater = (waterId: string) => {
  const water = data.value.waters.find((entry) => entry.id === waterId)
  if (!water) return
  if (data.value.sessions.some((session) => session.waterId === waterId)) {
    waterMessage.value = 'Dieses Gewässer kann nicht gelöscht werden, da Touren darauf verweisen.'
    return
  }
  if (!window.confirm(`Gewässer „${water.name}“ wirklich löschen?`)) return

  data.value.waters = data.value.waters.filter((entry) => entry.id !== waterId)
  if (editingWaterId.value === waterId) cancelWaterEdit()
  if (sessionForm.value.waterId === waterId) sessionForm.value.waterId = data.value.waters[0]?.id ?? ''
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
    const index = data.value.baits.findIndex((bait) => bait.id === editingBaitId.value)
    if (index < 0) return
    data.value.baits[index] = { ...data.value.baits[index]!, ...baitData }
  } else {
    data.value.baits.unshift({ id: createId(), ...baitData })
    catchForm.value.baitId = data.value.baits[0]?.id ?? ''
  }
  editingBaitId.value = null
  baitForm.value = { name: '', kind: 'Kunstköder' }
  gearMessage.value = ''
  saveData()
}

const editBait = (baitId: string) => {
  const bait = data.value.baits.find((entry) => entry.id === baitId)
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
  const bait = data.value.baits.find((entry) => entry.id === baitId)
  if (!bait) return
  if (data.value.catches.some((entry) => entry.baitId === baitId)) {
    gearMessage.value = 'Dieser Köder kann nicht gelöscht werden, da Fänge darauf verweisen.'
    return
  }
  if (!window.confirm(`Köder „${bait.name}“ wirklich löschen?`)) return

  data.value.baits = data.value.baits.filter((entry) => entry.id !== baitId)
  if (editingBaitId.value === baitId) cancelBaitEdit()
  if (catchForm.value.baitId === baitId) catchForm.value.baitId = data.value.baits[0]?.id ?? ''
  gearMessage.value = ''
  saveData()
}

const saveMontage = () => {
  if (!montageForm.value.title.trim()) return

  const montageData = {
    title: montageForm.value.title.trim()
  }
  if (editingMontageId.value) {
    const index = data.value.montages.findIndex((montage) => montage.id === editingMontageId.value)
    if (index < 0) return
    data.value.montages[index] = { ...data.value.montages[index]!, ...montageData }
  } else {
    data.value.montages.unshift({ id: createId(), ...montageData })
    catchForm.value.montageId = data.value.montages[0]?.id ?? ''
  }
  editingMontageId.value = null
  montageForm.value = { title: '' }
  gearMessage.value = ''
  saveData()
}

const editMontage = (montageId: string) => {
  const montage = data.value.montages.find((entry) => entry.id === montageId)
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
  const montage = data.value.montages.find((entry) => entry.id === montageId)
  if (!montage) return
  if (data.value.catches.some((entry) => entry.montageId === montageId)) {
    gearMessage.value = 'Diese Montage kann nicht gelöscht werden, da Fänge darauf verweisen.'
    return
  }
  if (!window.confirm(`Montage „${montage.title}“ wirklich löschen?`)) return

  data.value.montages = data.value.montages.filter((entry) => entry.id !== montageId)
  if (editingMontageId.value === montageId) cancelMontageEdit()
  if (catchForm.value.montageId === montageId) catchForm.value.montageId = data.value.montages[0]?.id ?? ''
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
    const index = data.value.rods.findIndex((rod) => rod.id === editingRodId.value)
    if (index < 0) return
    data.value.rods[index] = { ...data.value.rods[index]!, ...rodData }
  } else {
    data.value.rods.unshift({ id: createId(), ...rodData })
    catchForm.value.rodId = data.value.rods[0]?.id ?? ''
  }
  editingRodId.value = null
  rodForm.value = { type: 'Teleskop', length: 3.6 }
  gearMessage.value = ''
  saveData()
}

const editRod = (rodId: string) => {
  const rod = data.value.rods.find((entry) => entry.id === rodId)
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
  const rod = data.value.rods.find((entry) => entry.id === rodId)
  if (!rod) return
  if (data.value.catches.some((entry) => entry.rodId === rodId)) {
    gearMessage.value = 'Diese Rute kann nicht gelöscht werden, da Fänge darauf verweisen.'
    return
  }
  if (!window.confirm(`Rute „${rod.type} · ${rod.length} m“ wirklich löschen?`)) return

  data.value.rods = data.value.rods.filter((entry) => entry.id !== rodId)
  if (editingRodId.value === rodId) cancelRodEdit()
  if (catchForm.value.rodId === rodId) catchForm.value.rodId = data.value.rods[0]?.id ?? ''
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
    sunrise: sessionForm.value.sunrise,
    sunset: sessionForm.value.sunset,
    waterId: sessionForm.value.waterId
  }
  data.value.sessions.unshift(newSession)
  cancelCatchEdit()
  selectedSessionId.value = newSession.id
  isStartingTour.value = false
  isCreatingTour.value = false
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
    waterId: session.waterId
  }
  tourMessage.value = ''
  isCreatingTour.value = false
  isStartingTour.value = activeTab.value === 'home'
  expandedSessionId.value = session.id
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

const openNewTourForm = () => {
  const now = getLocalDateTime()
  editingSessionId.value = null
  sessionForm.value = {
    ...sessionForm.value,
    from: now,
    to: now,
    waterId: sessionForm.value.waterId || data.value.waters[0]?.id || ''
  }
  tourMessage.value = ''
  isCreatingTour.value = true
}

const deleteTour = (sessionId: string) => {
  const session = data.value.sessions.find((entry) => entry.id === sessionId)
  if (!session) return
  if (data.value.catches.some((entry) => entry.sessionId === sessionId)) {
    tourMessage.value = 'Tour hat bereits erfasste Fänge'
    return
  }

  const waterName = data.value.waters.find((water) => water.id === session.waterId)?.name ?? 'Unbekanntes Gewässer'
  if (!window.confirm(`Möchten Sie die Tour am ${formatCatchDate(session.from)} am Gewässer „${waterName}“ wirklich löschen?`)) return

  data.value.sessions = data.value.sessions.filter((entry) => entry.id !== sessionId)
  if (selectedSessionId.value === sessionId) {
    selectedSessionId.value = ''
    cancelCatchEdit()
  }
  if (expandedSessionId.value === sessionId) expandedSessionId.value = ''
  tourMessage.value = ''
  saveData()
}

const openPhotoCatch = (photo: PhotoMetadata, session: FishingSession, isNew: boolean) => {
  const previousSessions = data.value.sessions
  data.value.sessions = isNew
    ? [session, ...previousSessions]
    : previousSessions.map((entry) => entry.id === session.id ? session : entry)
  try {
    saveData()
  } catch {
    data.value.sessions = previousSessions
    photoError.value = 'Die Tour konnte nicht gespeichert werden. Bitte prüfe den verfügbaren Browser-Speicher.'
    return
  }

  cancelCatchEdit()
  catchForm.value = { ...createCatchForm(), time: photo.time, latitude: photo.latitude, longitude: photo.longitude }
  selectedSessionId.value = session.id
  isPhotoCatch.value = true
  isEnteringCatch.value = true
  isStartingTour.value = false
  activeTab.value = 'home'
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
  data.value.sessions.find((session) => session.id === selectedSessionId.value) ?? null
)
const activeSession = computed(() => data.value.sessions.find((session) => !session.to) ?? null)
const activeSessionWaterName = computed(() =>
  data.value.waters.find((water) => water.id === activeSession.value?.waterId)?.name ?? 'Unbekanntes Gewässer'
)
const activeGearSection = computed<'rods' | 'baits' | 'montages'>(() =>
  activeMasterData.value === 'waters' ? 'rods' : activeMasterData.value
)
const catchesForSelectedSession = computed(() =>
  data.value.catches.filter((entry) => entry.sessionId === selectedSessionId.value)
)
const catchesForSession = (sessionId: string) =>
  data.value.catches
    .filter((entry) => entry.sessionId === sessionId)
    .sort((first, second) => second.time.localeCompare(first.time))
const sortedSessions = computed(() =>
  [...data.value.sessions].sort((first, second) => second.from.localeCompare(first.from))
)
const latestCatches = computed(() =>
  [...data.value.catches]
    .sort((first, second) => second.time.localeCompare(first.time))
    .slice(0, 10)
)
const formatCatchDate = (time: string) => {
  const date = new Date(time)
  return Number.isNaN(date.getTime()) ? time : date.toLocaleDateString('de-DE')
}
const totalCatches = computed(() => data.value.catches.length)
const totalWeight = computed(() => data.value.catches.reduce((sum, entry) => sum + (entry.weightKg ?? 0), 0))
const biggestCatch = computed(() => {
  if (!data.value.catches.length) return null
  return [...data.value.catches].sort((a, b) => b.lengthCm - a.lengthCm)[0] ?? null
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
            :waters="data.waters"
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
                    <strong>{{ data.waters.find((water) => water.id === session.waterId)?.name ?? 'Unbekanntes Gewässer' }}</strong>
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
                  class="button is-light tour-edit"
                  type="button"
                  :aria-label="`Tour am ${formatCatchDate(session.from)} bearbeiten`"
                  title="Tour bearbeiten"
                  @click="editTour(session)"
                >
                  <span aria-hidden="true">✎</span>
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
                <FishingEventForm
                  v-if="editingSessionId === session.id"
                  v-model="sessionForm"
                  :waters="data.waters"
                  heading="Tour bearbeiten"
                  submit-label="Tour speichern"
                  :show-cancel="true"
                  @submit="saveActiveTour"
                  @cancel="cancelTourForm"
                />
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
                    {{ data.baits.find((bait) => bait.id === entry.baitId)?.name ?? 'Unbekannter Köder' }}
                  </span>
                  <div class="buttons are-small">
                    <button class="button is-light" type="button" @click="editCatch(entry.id)">Bearbeiten</button>
                    <button class="button is-danger is-light" type="button" @click="deleteCatch(entry.id)">Löschen</button>
                  </div>
                </div>
                <CatchView
                  v-if="isEnteringCatch && selectedSessionId === session.id && selectedSession"
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
                  :auto-locate="!isPhotoCatch"
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
        :waters="data.waters"
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
        :baits="data.baits"
        :montages="data.montages"
        :rods="data.rods"
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
        :sessions="data.sessions"
        :catches="data.catches"
        :waters="data.waters"
        :species="species"
        :rods="data.rods"
        :baits="data.baits"
        :data-message="dataMessage"
        @export-json="exportJson"
        @export-csv="exportCsv"
        @import-data="importData"
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
