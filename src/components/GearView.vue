<script setup lang="ts">
import { ref } from 'vue'
import RigView from './RigView.vue'
import RodView from './RodView.vue'
import { createId } from '../utils/createId'
import type { Bait, BaitForm, CatchEntry, CatchForm, Montage, MontageForm, Rod, RodForm } from '../types'

const props = defineProps<{
  catches: CatchEntry[]
  section: 'rods' | 'baits' | 'montages'
}>()
const baits = defineModel<Bait[]>('baits', { required: true })
const montages = defineModel<Montage[]>('montages', { required: true })
const rods = defineModel<Rod[]>('rods', { required: true })
const emit = defineEmits<{
  save: [selection: Partial<Pick<CatchForm, 'baitId' | 'montageId' | 'rodId'>>]
}>()
const baitForm = ref<BaitForm>({ name: '', kind: 'Kunstköder' })
const montageForm = ref<MontageForm>({ title: '' })
const rodForm = ref<RodForm>({ type: 'Teleskop', length: 3.6, notes: '' })
const editingBaitId = ref<string | null>(null)
const editingMontageId = ref<string | null>(null)
const editingRodId = ref<string | null>(null)
const gearMessage = ref('')

const cancelBaitEdit = () => {
  editingBaitId.value = null
  baitForm.value = { name: '', kind: 'Kunstköder' }
  gearMessage.value = ''
}

const saveBait = () => {
  if (!baitForm.value.name.trim()) return

  const baitData = {
    name: baitForm.value.name.trim(),
    kind: baitForm.value.kind
  }
  let selection: Partial<Pick<CatchForm, 'baitId'>> = {}
  if (editingBaitId.value) {
    const index = baits.value.findIndex((bait) => bait.id === editingBaitId.value)
    if (index < 0) return
    baits.value = baits.value.map((bait, baitIndex) =>
      baitIndex === index ? { ...bait, ...baitData } : bait
    )
  } else {
    const baitId = createId()
    baits.value = [{ id: baitId, ...baitData }, ...baits.value]
    selection = { baitId }
  }
  cancelBaitEdit()
  emit('save', selection)
}

const editBait = (baitId: string) => {
  const bait = baits.value.find((entry) => entry.id === baitId)
  if (!bait) return
  editingBaitId.value = bait.id
  baitForm.value = { name: bait.name, kind: bait.kind }
  gearMessage.value = ''
}

const deleteBait = (baitId: string) => {
  const bait = baits.value.find((entry) => entry.id === baitId)
  if (!bait) return
  if (props.catches.some((entry) => entry.baitId === baitId)) {
    gearMessage.value = 'Dieser Köder kann nicht gelöscht werden, da Fänge darauf verweisen.'
    return
  }
  if (!window.confirm(`Köder „${bait.name}“ wirklich löschen?`)) return

  baits.value = baits.value.filter((entry) => entry.id !== baitId)
  if (editingBaitId.value === baitId) cancelBaitEdit()
  gearMessage.value = ''
  emit('save', {})
}

const cancelMontageEdit = () => {
  editingMontageId.value = null
  montageForm.value = { title: '' }
  gearMessage.value = ''
}

const saveMontage = () => {
  if (!montageForm.value.title.trim()) return

  const montageData = { title: montageForm.value.title.trim() }
  let selection: Partial<Pick<CatchForm, 'montageId'>> = {}
  if (editingMontageId.value) {
    const index = montages.value.findIndex((montage) => montage.id === editingMontageId.value)
    if (index < 0) return
    montages.value = montages.value.map((montage, montageIndex) =>
      montageIndex === index ? { ...montage, ...montageData } : montage
    )
  } else {
    const montageId = createId()
    montages.value = [{ id: montageId, ...montageData }, ...montages.value]
    selection = { montageId }
  }
  cancelMontageEdit()
  emit('save', selection)
}

const editMontage = (montageId: string) => {
  const montage = montages.value.find((entry) => entry.id === montageId)
  if (!montage) return
  editingMontageId.value = montage.id
  montageForm.value = { title: montage.title }
  gearMessage.value = ''
}

const deleteMontage = (montageId: string) => {
  const montage = montages.value.find((entry) => entry.id === montageId)
  if (!montage) return
  if (props.catches.some((entry) => entry.montageId === montageId)) {
    gearMessage.value = 'Diese Montage kann nicht gelöscht werden, da Fänge darauf verweisen.'
    return
  }
  if (!window.confirm(`Montage „${montage.title}“ wirklich löschen?`)) return

  montages.value = montages.value.filter((entry) => entry.id !== montageId)
  if (editingMontageId.value === montageId) cancelMontageEdit()
  gearMessage.value = ''
  emit('save', {})
}

const cancelRodEdit = () => {
  editingRodId.value = null
  rodForm.value = { type: 'Teleskop', length: 3.6, notes: '' }
  gearMessage.value = ''
}

const saveRod = () => {
  if (!rodForm.value.type) return

  const rodData = {
    type: rodForm.value.type,
    length: Number(rodForm.value.length) || 3.6,
    notes: rodForm.value.notes?.trim() || undefined
  }
  let selection: Partial<Pick<CatchForm, 'rodId'>> = {}
  if (editingRodId.value) {
    const index = rods.value.findIndex((rod) => rod.id === editingRodId.value)
    if (index < 0) return
    rods.value = rods.value.map((rod, rodIndex) =>
      rodIndex === index ? { ...rod, ...rodData } : rod
    )
  } else {
    const rodId = createId()
    rods.value = [{ id: rodId, ...rodData }, ...rods.value]
    selection = { rodId }
  }
  cancelRodEdit()
  emit('save', selection)
}

const editRod = (rodId: string) => {
  const rod = rods.value.find((entry) => entry.id === rodId)
  if (!rod) return
  editingRodId.value = rod.id
  rodForm.value = { type: rod.type, length: rod.length, notes: rod.notes ?? '' }
  gearMessage.value = ''
}

const deleteRod = (rodId: string) => {
  const rod = rods.value.find((entry) => entry.id === rodId)
  if (!rod) return
  if (props.catches.some((entry) => entry.rodId === rodId)) {
    gearMessage.value = 'Diese Rute kann nicht gelöscht werden, da Fänge darauf verweisen.'
    return
  }
  if (!window.confirm(`Rute „${rod.type} · ${rod.length} m“ wirklich löschen?`)) return

  rods.value = rods.value.filter((entry) => entry.id !== rodId)
  if (editingRodId.value === rodId) cancelRodEdit()
  gearMessage.value = ''
  emit('save', {})
}
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
        :message="gearMessage"
        @save-bait="saveBait"
        @edit-bait="editBait"
        @delete-bait="deleteBait"
        @cancel-bait-edit="cancelBaitEdit"
        @save-montage="saveMontage"
        @edit-montage="editMontage"
        @delete-montage="deleteMontage"
        @cancel-montage-edit="cancelMontageEdit"
      />
      <RodView
        v-else
        v-model="rodForm"
        :rods="rods"
        :editing-rod-id="editingRodId"
        :message="gearMessage"
        @submit="saveRod"
        @edit="editRod"
        @delete="deleteRod"
        @cancel-edit="cancelRodEdit"
      />
    </div>
  </section>
</template>
