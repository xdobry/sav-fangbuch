<script setup lang="ts">
import type { Rod, RodForm } from '../types'

defineProps<{ rods: Rod[] }>()
const form = defineModel<RodForm>({ required: true })
defineEmits<{ submit: [] }>()
</script>

<template>
  <div class="box">
    <h2 class="subtitle is-6">Angelruten erfassen</h2>
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
    <button class="button is-link" @click="$emit('submit')">Rute speichern</button>

    <h3 class="title is-6 mt-5">Verfügbare Ruten</h3>
    <ul>
      <li v-for="rod in rods" :key="rod.id">{{ rod.type }} · {{ rod.length }} m</li>
    </ul>
  </div>
</template>
