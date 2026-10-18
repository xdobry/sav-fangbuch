<script setup lang="ts">
import type { Water, WaterForm } from '../types'

defineProps<{ waters: Water[] }>()
const form = defineModel<WaterForm>({ required: true })
defineEmits<{ submit: [] }>()
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title is-4">Gewässer</h1>
      <div class="box">
        <h2 class="subtitle is-6">Gewässer erfassen</h2>
        <div class="field">
          <label class="label">Name</label>
          <div class="control"><input v-model="form.name" class="input" placeholder="z. B. Baggersee" /></div>
        </div>
        <div class="field">
          <label class="label">Standort</label>
          <div class="control"><input v-model="form.location" class="input" placeholder="z. B. München" /></div>
        </div>
        <button class="button is-primary" @click="$emit('submit')">Gewässer speichern</button>
      </div>

      <div class="box">
        <h2 class="subtitle is-6">Vorhandene Gewässer</h2>
        <div v-if="waters.length === 0" class="has-text-grey">Keine Gewässer vorhanden.</div>
        <table v-else class="table is-fullwidth is-narrow">
          <thead><tr><th>Name</th><th>Standort</th></tr></thead>
          <tbody>
            <tr v-for="water in waters" :key="water.id">
              <td>{{ water.name }}</td>
              <td>{{ water.location }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
