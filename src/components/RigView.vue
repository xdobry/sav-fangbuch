<script setup lang="ts">
import type { Bait, BaitForm } from '../types'

defineProps<{ baits: Bait[] }>()
const form = defineModel<BaitForm>({ required: true })
defineEmits<{ submit: [] }>()
</script>

<template>
  <div class="box">
    <h2 class="subtitle is-6">Köder und Montage erfassen</h2>
    <div class="columns is-multiline">
      <div class="column is-half">
        <label class="label">Name</label>
        <input v-model="form.name" class="input" placeholder="z. B. Spinner" />
      </div>
      <div class="column is-half">
        <label class="label">Kategorie</label>
        <div class="select is-fullwidth">
          <select v-model="form.category">
            <option>Vorfach</option>
            <option>Haken</option>
            <option>Köder</option>
          </select>
        </div>
      </div>
      <div class="column is-full">
        <label class="label">Art</label>
        <div class="select is-fullwidth">
          <select v-model="form.kind">
            <option>Lebend</option>
            <option>Kunstköder</option>
          </select>
        </div>
      </div>
    </div>
    <button class="button is-primary" @click="$emit('submit')">Köder speichern</button>

    <h3 class="title is-6 mt-5">Verfügbare Köder und Montageteile</h3>
    <ul>
      <li v-for="bait in baits" :key="bait.id">{{ bait.name }} · {{ bait.category }} · {{ bait.kind }}</li>
    </ul>
  </div>
</template>
