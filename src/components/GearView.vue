<script setup lang="ts">
import RigView from './RigView.vue'
import RodView from './RodView.vue'
import type { Bait, BaitForm, Montage, MontageForm, Rod, RodForm } from '../types'

defineProps<{
  baits: Bait[]
  montages: Montage[]
  rods: Rod[]
  section: 'rods' | 'baits' | 'montages'
  editingBaitId: string | null
  editingMontageId: string | null
  editingRodId: string | null
  message: string
}>()
const baitForm = defineModel<BaitForm>('baitForm', { required: true })
const montageForm = defineModel<MontageForm>('montageForm', { required: true })
const rodForm = defineModel<RodForm>('rodForm', { required: true })
defineEmits<{
  saveBait: []
  editBait: [baitId: string]
  deleteBait: [baitId: string]
  cancelBaitEdit: []
  saveMontage: []
  editMontage: [montageId: string]
  deleteMontage: [montageId: string]
  cancelMontageEdit: []
  saveRod: []
  editRod: [rodId: string]
  deleteRod: [rodId: string]
  cancelRodEdit: []
}>()
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title is-4">
        {{ section === 'rods' ? 'Ruten' : section === 'baits' ? 'Köder' : 'Montagen' }}
      </h1>
      <RigView
        v-if="section === 'baits' || section === 'montages'"
        v-model="baitForm"
        v-model:montage-form="montageForm"
        :baits="baits"
        :montages="montages"
        :section="section"
        :editing-bait-id="editingBaitId"
        :editing-montage-id="editingMontageId"
        :message="message"
        @save-bait="$emit('saveBait')"
        @edit-bait="$emit('editBait', $event)"
        @delete-bait="$emit('deleteBait', $event)"
        @cancel-bait-edit="$emit('cancelBaitEdit')"
        @save-montage="$emit('saveMontage')"
        @edit-montage="$emit('editMontage', $event)"
        @delete-montage="$emit('deleteMontage', $event)"
        @cancel-montage-edit="$emit('cancelMontageEdit')"
      />
      <RodView
        v-else
        v-model="rodForm"
        :rods="rods"
        :editing-rod-id="editingRodId"
        :message="message"
        @submit="$emit('saveRod')"
        @edit="$emit('editRod', $event)"
        @delete="$emit('deleteRod', $event)"
        @cancel-edit="$emit('cancelRodEdit')"
      />
    </div>
  </section>
</template>
