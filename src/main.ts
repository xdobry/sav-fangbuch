import { createApp } from 'vue'
import 'bulma/css/bulma.min.css'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`)
      .catch((error: unknown) => console.error('Der Offline-Support konnte nicht aktiviert werden.', error))
  })
}
