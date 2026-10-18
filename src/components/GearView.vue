<script setup lang="ts">
import RigView from './RigView.vue'
import RodView from './RodView.vue'
import type { Bait, BaitForm, Rod, RodForm } from '../types'

defineProps<{ baits: Bait[]; rods: Rod[] }>()
const baitForm = defineModel<BaitForm>('baitForm', { required: true })
const rodForm = defineModel<RodForm>('rodForm', { required: true })
defineEmits<{ addBait: []; addRod: [] }>()
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title is-4">Köder und Ruten</h1>
      <RigView v-model="baitForm" :baits="baits" @submit="$emit('addBait')" />
      <RodView v-model="rodForm" :rods="rods" @submit="$emit('addRod')" />
    </div>
  </section>
</template>
