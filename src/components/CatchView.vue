<script setup lang="ts">
import type { Bait, CatchEntry, CatchForm, FishSpecies, FishingSession, Rod, Water } from '../types'

defineProps<{
  waters: Water[]
  species: FishSpecies[]
  rods: Rod[]
  baits: Bait[]
  catches: CatchEntry[]
  session: FishingSession
  editingCatchId: string | null
}>()
const form = defineModel<CatchForm>({ required: true })
defineEmits<{
  submit: []
  edit: [catchId: string]
  delete: [catchId: string]
  cancelEdit: []
}>()
</script>

<template>
  <div class="box">
    <h2 class="subtitle is-6">
      {{ editingCatchId ? 'Fischfang bearbeiten' : 'Fischfang für dieses Angelereignis erfassen' }}
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
      <button class="button is-link" @click="$emit('submit')">
        {{ editingCatchId ? 'Änderungen speichern' : 'Fang speichern' }}
      </button>
      <button v-if="editingCatchId" class="button" @click="$emit('cancelEdit')">Abbrechen</button>
    </div>
  </div>

  <div class="box">
    <h2 class="subtitle is-6">Erfasste Fänge</h2>
    <div v-if="catches.length === 0" class="has-text-grey">Noch keine Fänge erfasst.</div>
    <div v-else class="content">
      <div v-for="entry in catches" :key="entry.id" class="catch-row">
        <span>
          {{ species.find((fish) => fish.id === entry.speciesId)?.name }} ·
          {{ entry.time }} · {{ entry.lengthCm }} cm
          <span v-if="entry.weightKg">· {{ entry.weightKg }} kg</span>
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
