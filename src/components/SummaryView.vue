<script setup lang="ts">
import { ref } from 'vue'
import type { Bait, CatchEntry, FishSpecies, FishingSession, Rod, Water } from '../types'

defineProps<{
  totalCatches: number
  totalWeight: number
  biggestCatch: CatchEntry | null
  sessions: FishingSession[]
  catches: CatchEntry[]
  waters: Water[]
  species: FishSpecies[]
  rods: Rod[]
  baits: Bait[]
  dataMessage: string
}>()

const emit = defineEmits<{
  exportJson: []
  exportCsv: []
  importData: [file: File]
}>()
const importInput = ref<HTMLInputElement | null>(null)

const onImportSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('importData', file)
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
          <button class="button is-primary" type="button" @click="emit('exportJson')">Export JSON</button>
          <button class="button" type="button" @click="importInput?.click()">Import Data</button>
          <button class="button" type="button" @click="emit('exportCsv')">Export CSV</button>
          <input
            ref="importInput"
            class="is-hidden"
            type="file"
            accept="application/json,.json"
            aria-label="JSON-Datei zum Import auswählen"
            @change="onImportSelected"
          />
        </div>
        <p v-if="dataMessage" class="help" role="status">{{ dataMessage }}</p>
      </div>

      <div class="columns is-multiline">
        <div class="column is-one-third">
          <div class="box has-background-info-light">
            <h2 class="subtitle is-6">Fänge</h2>
            <p class="title is-4">{{ totalCatches }}</p>
          </div>
        </div>
        <div class="column is-one-third">
          <div class="box has-background-success-light">
            <h2 class="subtitle is-6">Gesamtgewicht</h2>
            <p class="title is-4">{{ totalWeight.toFixed(1) }} kg</p>
          </div>
        </div>
        <div class="column is-one-third">
          <div class="box has-background-warning-light">
            <h2 class="subtitle is-6">Größter Fang</h2>
            <p class="title is-4">{{ biggestCatch ? `${biggestCatch.lengthCm} cm` : '—' }}</p>
          </div>
        </div>
      </div>

      <div class="box">
        <h2 class="subtitle is-6">Touren und Fischfänge</h2>
        <div v-if="sessions.length === 0" class="has-text-grey">Noch keine Touren.</div>
        <div v-else>
          <article v-for="session in sessions" :key="session.id" class="mb-5">
            <h3 class="title is-6">
              {{ session.from }}{{ session.to ? ` bis ${session.to}` : ' · aktiv' }} ·
              {{ waters.find((water) => water.id === session.waterId)?.name ?? 'Unbekanntes Gewässer' }}
            </h3>
            <p class="mb-2">
              {{ session.temperature }}°C · {{ session.population }}% Bewölkung · {{ session.precipitation }}
              <span v-if="session.windSpeed10m !== undefined"> · Wind {{ session.windSpeed10m }} km/h</span>
              <span v-if="session.windDirection10m !== undefined"> · Richtung {{ session.windDirection10m }}°</span>
              <span v-if="session.weatherCode !== undefined"> · Wettercode {{ session.weatherCode }}</span>
            </p>
            <h4 class="has-text-weight-semibold">Fischfänge</h4>
            <p v-if="!catches.some((entry) => entry.sessionId === session.id)" class="has-text-grey">
              Keine Fischfänge zu dieser Tour.
            </p>
            <ul v-else>
              <li v-for="entry in catches.filter((catchEntry) => catchEntry.sessionId === session.id)" :key="entry.id">
                {{ entry.time }} · {{ species.find((fish) => fish.id === entry.speciesId)?.name ?? 'Unbekannter Fisch' }} ·
                {{ entry.lengthCm }} cm
                <span v-if="entry.weightKg">· {{ entry.weightKg }} kg</span>
                · Rute: {{ rods.find((rod) => rod.id === entry.rodId)?.type ?? 'Unbekannte Rute' }}
                · Köder: {{ baits.find((bait) => bait.id === entry.baitId)?.name ?? 'Unbekannter Köder' }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
