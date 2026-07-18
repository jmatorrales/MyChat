<template>
  <div class="flex h-full">
    <!-- Columna izquierda: buscador + lista de salas + crear grupo -->
    <div class="w-1/3 border-r flex flex-col">
      <!-- Buscador: busca a la vez usuarios (para chat individual) y salas de grupo por nombre -->
      <div class="p-3 border-b">
        <input v-model="busqueda" @input="buscar" type="text" placeholder="Buscar usuario o sala..."
          class="w-full border rounded-lg px-3 py-2" />

        <!-- resultados de usuarios: clic -> abre o crea el chat individual -->
        <div v-if="resultadosUsuarios.length" class="mt-2 space-y-1">
          <div v-for="user in resultadosUsuarios" :key="user.id" @click="iniciarChat(user.id)"
            class="cursor-pointer p-2 hover:bg-gray-100 rounded">
            {{ user.username }}
          </div>
        </div>

        <!-- resultados de salas de grupo: clic -> se une a la sala existente -->
        <div v-if="resultadosSalas.length" class="mt-2 space-y-1">
          <div v-for="sala in resultadosSalas" :key="sala.id" @click="unirseASala(sala.id)"
            class="cursor-pointer p-2 hover:bg-gray-100 rounded">
            🏠 {{ sala.name }}
          </div>
        </div>
      </div>

      <!-- Lista de salas/chats donde ya participa el usuario -->
      <div class="flex-1 overflow-y-auto">
        <div v-for="sala in roomsStore.salas" :key="sala.id" @click="roomsStore.seleccionarSala(sala)"
          class="p-3 cursor-pointer hover:bg-gray-100"
          :class="{ 'bg-gray-200': roomsStore.salaActiva?.id === sala.id }">
          {{ sala.displayName }}
        </div>
      </div>

      <!-- Crear sala de grupo nueva (Enter para confirmar) -->
      <div class="p-3 border-t">
        <input v-model="nuevoGrupo" @keyup.enter="crearGrupo" type="text" placeholder="Nombre de la nueva sala..."
          class="w-full border rounded-lg px-3 py-2" />
      </div>
    </div>

    <!-- Columna derecha: chat de la sala activa -->
    <div class="flex-1">
      <ChatWindow v-if="roomsStore.salaActiva" :sala="roomsStore.salaActiva" />
      <div v-else class="h-full flex items-center justify-center text-gray-400">
        Selecciona un chat para empezar
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoomsStore } from '../../stores/roomsStore.js'
import ChatWindow from '../../components/ChatWindow.vue'

const roomsStore = useRoomsStore()

const busqueda = ref('')
const resultadosUsuarios = ref([])
const resultadosSalas = ref([])
const nuevoGrupo = ref('')

onMounted(() => {
  roomsStore.fetchSalas() // carga la lista de salas del usuario logueado al entrar
})

// consulta usuarios y salas de grupo en paralelo por el mismo texto
async function buscar() {
  resultadosUsuarios.value = await roomsStore.buscarUsuarios(busqueda.value)
  resultadosSalas.value = await roomsStore.buscarSalas(busqueda.value)
}

// abre (o crea, si no existía) el chat individual con ese usuario
async function iniciarChat(userId) {
  await roomsStore.crearIndividual(userId)
  limpiarBusqueda()
}

// crea una sala de grupo nueva con el nombre escrito
async function crearGrupo() {
  if (!nuevoGrupo.value.trim()) return
  await roomsStore.crearGrupo(nuevoGrupo.value)
  nuevoGrupo.value = ''
}

// se une a una sala de grupo ya existente (encontrada en la búsqueda)
async function unirseASala(roomId) {
  await roomsStore.unirseGrupo(roomId)
  limpiarBusqueda()
}

function limpiarBusqueda() {
  busqueda.value = ''
  resultadosUsuarios.value = []
  resultadosSalas.value = []
}
</script>