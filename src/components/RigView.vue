<script setup lang="ts">
import type { Bait, BaitForm, Montage, MontageForm } from '../types'

defineProps<{
  baits: Bait[]
  montages: Montage[]
  section: 'baits' | 'montages'
  editingBaitId: string | null
  editingMontageId: string | null
  message: string
}>()
const form = defineModel<BaitForm>({ required: true })
const montageForm = defineModel<MontageForm>('montageForm', { required: true })
defineEmits<{
  saveBait: []
  editBait: [baitId: string]
  deleteBait: [baitId: string]
  cancelBaitEdit: []
  saveMontage: []
  editMontage: [montageId: string]
  deleteMontage: [montageId: string]
  cancelMontageEdit: []
}>()
</script>

<template>
  <div v-if="section === 'baits'" class="box">
    <h2 class="subtitle is-6">{{ editingBaitId ? 'Köder bearbeiten' : 'Köder erfassen' }}</h2>
    <div class="columns is-multiline">
      <div class="column is-half">
        <label class="label">Name</label>
        <input v-model="form.name" class="input" placeholder="z. B. Spinner" />
      </div>
      <div class="column is-half">
        <label class="label">Art</label>
        <div class="select is-fullwidth">
          <select v-model="form.kind">
            <option>Lebend</option>
            <option>Kunstköder</option>
            <option>Organisch</option>
          </select>
        </div>
      </div>
    </div>
    <p v-if="message" class="notification is-warning is-light" role="alert">{{ message }}</p>
    <div class="buttons">
      <button class="button is-primary" @click="$emit('saveBait')">
        {{ editingBaitId ? 'Änderungen speichern' : 'Köder speichern' }}
      </button>
      <button v-if="editingBaitId" class="button" type="button" @click="$emit('cancelBaitEdit')">Abbrechen</button>
    </div>

    <h3 class="title is-6 mt-5">Verfügbare Köder</h3>
    <div v-if="baits.length === 0" class="has-text-grey">Keine Köder vorhanden.</div>
    <ul v-else>
      <li v-for="bait in baits" :key="bait.id" class="master-data-row">
        <span>{{ bait.name }} · {{ bait.kind }}</span>
        <span class="buttons are-small">
          <button class="button is-light" @click="$emit('editBait', bait.id)">Bearbeiten</button>
          <button class="button is-danger is-light" @click="$emit('deleteBait', bait.id)">Löschen</button>
        </span>
      </li>
    </ul>
  </div>

  <div v-if="section === 'montages'" class="box">
    <h2 class="subtitle is-6">{{ editingMontageId ? 'Montage bearbeiten' : 'Montage erfassen' }}</h2>
    <div class="field">
      <label class="label">Name</label>
      <div class="control">
        <input v-model="montageForm.title" class="input" placeholder="z. B. Laufpose" />
      </div>
    </div>
    <p v-if="message" class="notification is-warning is-light" role="alert">{{ message }}</p>
    <div class="buttons">
      <button class="button is-primary" @click="$emit('saveMontage')">
        {{ editingMontageId ? 'Änderungen speichern' : 'Montage speichern' }}
      </button>
      <button v-if="editingMontageId" class="button" type="button" @click="$emit('cancelMontageEdit')">Abbrechen</button>
    </div>

    <h3 class="title is-6 mt-5">Verfügbare Montagen</h3>
    <div v-if="montages.length === 0" class="has-text-grey">Keine Montagen vorhanden.</div>
    <ul v-else>
      <li v-for="montage in montages" :key="montage.id" class="master-data-row">
        <span>{{ montage.title }}</span>
        <span class="buttons are-small">
          <button class="button is-light" @click="$emit('editMontage', montage.id)">Bearbeiten</button>
          <button class="button is-danger is-light" @click="$emit('deleteMontage', montage.id)">Löschen</button>
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.master-data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0;
}

.master-data-row .buttons {
  margin-bottom: 0;
}
</style>
