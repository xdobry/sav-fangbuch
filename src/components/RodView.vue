<script setup lang="ts">
import type { Rod, RodForm } from '../types'

defineProps<{
  rods: Rod[]
  editingRodId: string | null
  message: string
}>()
const form = defineModel<RodForm>({ required: true })
defineEmits<{
  submit: []
  edit: [rodId: string]
  delete: [rodId: string]
  cancelEdit: []
}>()
</script>

<template>
  <div class="box">
    <h2 class="subtitle is-6">{{ editingRodId ? 'Rute bearbeiten' : 'Angelruten erfassen' }}</h2>
    <div class="columns is-multiline">
      <div class="column is-half">
        <label class="label">Typ</label>
        <div class="select is-fullwidth">
          <select v-model="form.type">
            <option>Teleskop</option>
            <option>Feeder</option>
            <option>Karpfenrute</option>
            <option>Barschrute</option>
            <option>Sonstige</option>
          </select>
        </div>
      </div>
      <div class="column is-half">
        <label class="label">Länge (m)</label>
        <input v-model="form.length" type="number" step="0.1" min="1" class="input" />
      </div>
    </div>
    <p v-if="message" class="notification is-warning is-light" role="alert">{{ message }}</p>
    <div class="buttons">
      <button class="button is-link" @click="$emit('submit')">
        {{ editingRodId ? 'Änderungen speichern' : 'Rute speichern' }}
      </button>
      <button v-if="editingRodId" class="button" type="button" @click="$emit('cancelEdit')">Abbrechen</button>
    </div>

    <h3 class="title is-6 mt-5">Verfügbare Ruten</h3>
    <div v-if="rods.length === 0" class="has-text-grey">Keine Ruten vorhanden.</div>
    <ul v-else>
      <li v-for="rod in rods" :key="rod.id" class="rod-row">
        <span>{{ rod.type }} · {{ rod.length }} m</span>
        <span class="buttons are-small">
          <button class="button is-light" @click="$emit('edit', rod.id)">Bearbeiten</button>
          <button class="button is-danger is-light" @click="$emit('delete', rod.id)">Löschen</button>
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.rod-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0;
}

.rod-row .buttons {
  margin-bottom: 0;
}
</style>
