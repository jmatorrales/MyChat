<template>
  <div class="flex flex-col h-[100dvh]">
    <NavUser />
    <RouterView class="flex-1 min-h-0" />
    <!-- min-h-0: permite que el contenido interior haga scroll propio, sin forzar la altura de toda la página -->
    <SettingsUsers />
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
const { escucharActualizacionSalas } = useSocket()

let intervalo = null

onMounted(() => {

  // aviso en tiempo real (rápido, cuando funciona), el servidor sabe quién eres por el token del socket
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