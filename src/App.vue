<script setup lang="ts">
import { computed, onBeforeMount, onMounted, onUnmounted, ref } from 'vue'
import EventsView from './components/EventsView.vue'
import GearView from './components/GearView.vue'
import HomeView from './components/HomeView.vue'
import SummaryView from './components/SummaryView.vue'
import WaterView from './components/WaterView.vue'
import { useFangbuchData } from './composables/useFangbuchData'
import { defaultSpecies } from './data/defaults'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const { data, loadData: loadFangbuchData, saveData: persistData } = useFangbuchData()
const saveData = (onError?: () => void) => {
  try {
    persistData()
  } catch (error) {
    if (!onError) throw error
    onError()
  }
}
const species = defaultSpecies

const activeTab = ref<'home' | 'events' | 'masterdata' | 'summary'>('home')
const activeMasterData = ref<'waters' | 'rods' | 'baits' | 'montages'>('waters')
const masterDataItems = [
  { id: 'waters', label: 'Gewässer' },
  { id: 'rods', label: 'Ruten' },
  { id: 'baits', label: 'Köder' },
  { id: 'montages', label: 'Montagen' }
] as const
const installPrompt = ref<BeforeInstallPromptEvent | null>(null)

const loadData = () => {
  try {
    loadFangbuchData()
  } catch {
    console.warn('Could not parse stored data, falling back to defaults.')
  }
}

const onBeforeInstallPrompt = (event: Event) => {
  event.preventDefault()
  installPrompt.value = event as BeforeInstallPromptEvent
}

const onAppInstalled = () => {
  installPrompt.value = null
}

const installApp = async () => {
  if (!installPrompt.value) return

  const prompt = installPrompt.value
  try {
    await prompt.prompt()
    await prompt.userChoice
  } catch (error) {
    console.error('Die Installation des Fangbuchs konnte nicht gestartet werden.', error)
  } finally {
    installPrompt.value = null
  }
}

const openMasterData = (section: typeof activeMasterData.value) => {
  activeMasterData.value = section
  activeTab.value = 'masterdata'
}

const activeGearSection = computed<'rods' | 'baits' | 'montages'>(() =>
  activeMasterData.value === 'waters' ? 'rods' : activeMasterData.value
)

onBeforeMount(loadData)

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
})
</script>

<template>
  <div class="app-shell">
    <nav class="navbar is-primary" role="navigation" aria-label="main navigation">
      <div class="navbar-menu is-active">
        <div class="navbar-start">
          <button
            class="navbar-item button is-primary is-inverted is-light"
            :class="{ 'is-selected': activeTab === 'home' }"
            @click="activeTab = 'home'"
          >
            Start
          </button>
          <button
            class="navbar-item button is-primary is-inverted is-light"
            :class="{ 'is-selected': activeTab === 'events' }"
            @click="activeTab = 'events'"
          >
            Touren
          </button>
          <div class="masterdata-menu">
            <button
              class="navbar-item button is-primary is-inverted is-light"
              :aria-expanded="activeTab === 'masterdata'"
              @click="openMasterData(activeMasterData)"
            >
              Stammdaten
            </button>
            <div v-if="activeTab === 'masterdata'" class="masterdata-submenu" aria-label="Stammdaten">
              <button
                v-for="item in masterDataItems"
                :key="item.id"
                class="navbar-item button is-primary is-inverted is-light"
                :class="{ 'is-selected': activeMasterData === item.id }"
                @click="openMasterData(item.id)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <button class="navbar-item button is-primary is-inverted is-light" @click="activeTab = 'summary'">Übersicht</button>
          <button
            v-if="installPrompt"
            class="navbar-item button is-primary is-inverted is-light"
            type="button"
            @click="installApp"
          >
            App installieren
          </button>
        </div>
      </div>
    </nav>

    <main class="page-content">
      <HomeView
        v-show="activeTab === 'home'"
        v-model:data="data"
        @save="saveData"
      />

      <EventsView
        v-if="activeTab === 'events'"
        v-model:sessions="data.sessions"
        v-model:catches="data.catches"
        :waters="data.waters"
        :species="species"
        :rods="data.rods"
        :baits="data.baits"
        :montages="data.montages"
        @save="saveData"
      />

      <WaterView
        v-else-if="activeTab === 'masterdata' && activeMasterData === 'waters'"
        v-model:waters="data.waters"
        :sessions="data.sessions"
        @save="saveData()"
      />

      <GearView
        v-else-if="activeTab === 'masterdata'"
        v-model:baits="data.baits"
        v-model:montages="data.montages"
        v-model:rods="data.rods"
        :section="activeGearSection"
        :catches="data.catches"
        @save="saveData()"
      />

      <SummaryView
        v-else-if="activeTab === 'summary'"
        v-model:data="data"
        :species="species"
        @save="saveData"
      />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.page-content {
  padding-bottom: 3rem;
}

.navbar-item.button {
  height: auto;
  margin: 0.25rem;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  font-size: 0.875rem;
  line-height: 1.2;
}

.navbar-menu.is-active,
.navbar-start {
  display: flex;
  flex-wrap: wrap;
}

.masterdata-menu {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.masterdata-submenu {
  display: flex;
  flex-wrap: wrap;
  padding-left: 0.5rem;
  border-left: 1px solid rgba(255, 255, 255, 0.45);
}

.navbar-menu.is-active {
  padding: 0.25rem;
}
</style>
