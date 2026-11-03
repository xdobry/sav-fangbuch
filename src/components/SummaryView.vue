<script setup lang="ts">
import { ref, computed } from 'vue'
import { exportCsvFile, exportJsonFile, importJsonData } from '../services/importExport'
import type { FangbuchData, FishSpecies } from '../types'

const props = defineProps<{
  species: FishSpecies[]
}>()

const data = defineModel<FangbuchData>('data', { required: true })
const dataMessage = ref('')
const sessions = computed(() =>
  [...data.value.sessions].sort((first, second) => second.from.localeCompare(first.from))
)
const filterSpecie = ref('all')
const filterWater = ref('all')

const speciesSummary = computed(() => {
  const summary = new Map<string, {
    speciesId: string
    name: string
    caught: number
    retained: number
    maxLengthCm: number
  }>()
  for (const entry of data.value.catches) {
    let row = summary.get(entry.speciesId)
    if (!row) {
      row = {
        speciesId: entry.speciesId,
        name: props.species.find((fish) => fish.id === entry.speciesId)?.name ?? 'Unbekannter Fisch',
        caught: 0,
        retained: 0,
        maxLengthCm: 0,
      }
      summary.set(entry.speciesId, row)
    }
    row.caught += 1
    if (entry.retained) row.retained += 1
    row.maxLengthCm = Math.max(row.maxLengthCm, entry.lengthCm)
  }
  return [...summary.values()].sort((first, second) =>
    second.caught - first.caught || first.name.localeCompare(second.name, 'de')
  )
})

const stats = computed(() => {
  const stats = {
    totalCatches: 0,
    totalWeight: 0.0,
    biggestCatch: 0.0,
  }
  for (const one_catch of data.value.catches) {
    if (filterSpecie.value==='all' || filterSpecie.value === one_catch.speciesId) {
      if (filterWater.value!=='all') {
        const session = sessions.value.find((entry) => entry.id === one_catch.sessionId)
        if (session && session.waterId!==filterWater.value) {
          continue;
        }
      }
      stats.totalCatches++;
      if (one_catch.weightKg) {
        stats.totalWeight += one_catch.weightKg
      }
      if (one_catch.lengthCm>stats.biggestCatch) {
        stats.biggestCatch = one_catch.lengthCm
      }
    }
  }
  return stats
})

const emit = defineEmits<{
  save: []
}>()
const importInput = ref<HTMLInputElement | null>(null)

const exportJson = () => {
  exportJsonFile(data.value)
  dataMessage.value = 'JSON-Export wurde heruntergeladen.'
}

const exportCsv = () => {
  exportCsvFile(data.value, props.species)
  dataMessage.value = 'CSV-Export wurde heruntergeladen.'
}

const importData = async (file: File) => {
  dataMessage.value = ''
  try {
    const imported = importJsonData(await file.text(), data.value)
    data.value = imported.data
    emit('save')
    dataMessage.value = `${imported.addedSessions} Tour(en) und ${imported.addedCatches} Fang/Fänge importiert. Vorhandene Datensätze wurden beibehalten.`
  } catch (error) {
    dataMessage.value = error instanceof Error
      ? `Import fehlgeschlagen: ${error.message}`
      : 'Import fehlgeschlagen: Die Datei konnte nicht gelesen werden.'
  }
}

const onImportSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void importData(file)
  input.value = ''
}
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title is-4">Übersicht</h1>

      <div class="box">
        <h2 class="subtitle is-6">Daten</h2>
        <div class="buttons">
          <button class="button is-primary" type="button" @click="exportJson">Export JSON</button>
          <button class="button" type="button" @click="importInput?.click()">Import Data</button>
          <button class="button" type="button" @click="exportCsv">Export CSV</button>
          <input ref="importInput" class="is-hidden" type="file" accept="application/json,.json"
            aria-label="JSON-Datei zum Import auswählen" @change="onImportSelected" />
        </div>
        <p v-if="dataMessage" class="help" role="status">{{ dataMessage }}</p>
      </div>

      <div class="table-container mb-5">
        <table class="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th scope="col">Fischart</th>
              <th scope="col" class="has-text-right">Gefangen</th>
              <th scope="col" class="has-text-right">Entnommen</th>
              <th scope="col" class="has-text-right">Max Länge</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in speciesSummary" :key="row.speciesId">
              <th scope="row">{{ row.name }}</th>
              <td class="has-text-right">{{ row.caught }}</td>
              <td class="has-text-right">{{ row.retained }}</td>
              <td class="has-text-right">{{ row.maxLengthCm }} cm</td>
            </tr>
            <tr v-if="speciesSummary.length === 0">
              <td colspan="4" class="has-text-grey">Noch keine Fänge.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="columns is-multiline">
          <div class="column is-half">
            <label class="label">Fischart</label>
            <div class="select is-fullwidth">
              <select v-model="filterSpecie">
                <option value="all">Alle Fischarten</option>
                <option v-for="fish in species" :key="fish.id" :value="fish.id">{{ fish.name }}</option>
              </select>
            </div>
          </div>
          <div class="column is-half">
            <label class="label">Gewässer</label>
            <div class="select is-fullwidth">
              <select v-model="filterWater">
                <option value="all">Alle Gewässer</option>
                <option v-for="water in data.waters" :key="water.id" :value="water.id">
                  {{ water.location ? `${water.name} (${water.location})` : water.name }}
                </option>
              </select>
            </div>
          </div>
      </div>


      <div class="columns is-multiline">
        <div class="column is-one-third">
          <div class="box has-background-info-20 ">
            <h2 class="subtitle is-6 has-text-info-20-invert">Fänge</h2>
            <p class="title is-4 has-text-info-20-invert">{{ stats.totalCatches }}</p>
          </div>
        </div>
        <div class="column is-one-third">
          <div class="box has-background-info-25">
            <h2 class="subtitle is-6 has-text-info-25-invert">Gesamtgewicht</h2>
            <p class="title is-4 has-text-info-25-invert">{{ stats.totalWeight }} kg</p>
          </div>
        </div>
        <div class="column is-one-third">
          <div class="box has-background-info-30">
            <h2 class="subtitle is-6 has-text-info-30-invert">Größter Fang</h2>
            <p class="title is-4 has-text-info-30-invert">{{ stats.biggestCatch }}</p>
          </div>
        </div>
      </div>

      <div class="box">
        <h2 class="subtitle is-6">Touren und Fischfänge</h2>
        <div v-if="sessions.length === 0" class="has-text-grey">Noch keine Touren.</div>
        <div v-else>
          <article v-for="session in sessions.filter((s) => (filterWater==='all' || s.waterId===filterWater) &&
            (filterSpecie==='all' || data.catches.some((c) => c.sessionId===s.id && c.speciesId===filterSpecie)))" :key="session.id" class="mb-5">
            <h3 class="title is-6">
              {{ session.from }}{{ session.to ? ` bis ${session.to}` : ' · aktiv' }} ·
              {{data.waters.find((water) => water.id === session.waterId)?.name ?? 'Unbekanntes Gewässer'}}
            </h3>
            <p class="mb-2">
              {{ session.temperature }}°C · {{ session.population }}% Bewölkung · {{ session.precipitation }}
              <span v-if="session.windSpeed10m !== undefined"> · Wind {{ session.windSpeed10m }} km/h</span>
              <span v-if="session.windDirection10m !== undefined"> · Richtung {{ session.windDirection10m }}°</span>
              <span v-if="session.weatherCode !== undefined"> · Wettercode {{ session.weatherCode }}</span>
            </p>
            <h4 class="has-text-weight-semibold">Fischfänge</h4>
            <p v-if="!data.catches.some((entry) => entry.sessionId === session.id)" class="has-text-grey">
              Keine Fischfänge zu dieser Tour.
            </p>
            <ul v-else>
              <li v-for="entry in data.catches.filter((catchEntry) => catchEntry.sessionId === session.id && 
                (filterSpecie==='all' || catchEntry.speciesId===filterSpecie))" :key="entry.id">
                {{species.find((fish) => fish.id === entry.speciesId)?.name ?? 'Unbekannter Fisch'
                }} ·
                {{ entry.lengthCm }} cm · {{ entry.time }}
                <span v-if="entry.weightKg">· {{ entry.weightKg }} kg</span>
                · Rute: {{data.rods.find((rod) => rod.id === entry.rodId)?.type ?? 'Unbekannte Rute'}}
                · Köder: {{data.baits.find((bait) => bait.id === entry.baitId)?.name ?? 'Unbekannter Köder'}}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
