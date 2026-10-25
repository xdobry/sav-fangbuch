<script setup lang="ts">
import type { FishingSessionForm, Water } from '../types'

defineProps<{ waters: Water[] }>()
const form = defineModel<FishingSessionForm>({ required: true })
defineEmits<{ submit: [] }>()
</script>

<template>
  <div class="box">
    <h2 class="subtitle is-6">Angeltermin erfassen</h2>
    <div class="columns is-multiline">
      <div class="column is-half">
        <label class="label">Von</label>
        <input v-model="form.from" type="datetime-local" class="input" />
      </div>
      <div class="column is-half">
        <label class="label">Bis</label>
        <input v-model="form.to" type="datetime-local" class="input" />
      </div>
      <div class="column is-one-third">
        <label class="label">Temperatur °C</label>
        <input v-model="form.temperature" type="number" class="input" />
      </div>
      <div class="column is-one-third">
        <label class="label">Bewölkerung %</label>
        <input v-model="form.population" type="number" min="0" max="100" class="input" />
      </div>
      <div class="column is-one-third">
        <label class="label">Niederschlag</label>
        <div class="select is-fullwidth">
          <select v-model="form.precipitation">
            <option>Kein</option>
            <option>Leicht</option>
            <option>Stark</option>
          </select>
        </div>
      </div>
      <div class="column is-full">
        <label class="label">Gewässer</label>
        <div class="select is-fullwidth">
          <select v-model="form.waterId">
            <option v-for="water in waters" :key="water.id" :value="water.id">
              {{ water.location ? `${water.name} (${water.location})` : water.name }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <button class="button is-primary mt-3" @click="$emit('submit')">Angeltermin speichern</button>
  </div>
</template>
