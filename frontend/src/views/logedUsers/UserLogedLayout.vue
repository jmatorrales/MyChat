<template>
  <div class="flex flex-col h-screen">
    <NavUser />
    <RouterView class="flex-1" /> <!-- aquí se renderiza Salas.vue -->
    <SettingsUsers /> <!-- modal de ajustes, se muestra/oculta con uiStore.showSettings -->
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import NavUser from '../../components/NavUser.vue'
import SettingsUsers from '../../components/SettingsUsers.vue'
import { useSocket } from '../../composables/useSocket.js'
import { useAuthStore } from '../../stores/authStore.js'
import { useRoomsStore } from '../../stores/roomsStore.js'

const authStore = useAuthStore()
const roomsStore = useRoomsStore()
const { identificarse, escucharActualizacionSalas } = useSocket()

let intervalo = null

onMounted(() => {
  identificarse(authStore.usuario.id)

  // aviso en tiempo real (rápido, cuando funciona)
  escucharActualizacionSalas(() => {
    roomsStore.fetchSalas()
  })

  // red de seguridad: si el socket se pierde algún aviso (reconexión, móvil en background, etc.),
  // esto garantiza que la lista se actualice igualmente en pocos segundos
  intervalo = setInterval(() => {
    roomsStore.fetchSalas()
  }, 5000) // cada 5 segundos
})

onUnmounted(() => {
  if (intervalo) clearInterval(intervalo)
})
</script>