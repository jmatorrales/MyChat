<template>
  <div class="flex h-full">
    <div :class="themeStore.current.sidebarBg" class="w-1/6 border-r flex flex-col">
      <!-- Buscador: @usuario o #sala. Flechas para moverte, Enter para confirmar -->
      <div class="p-3 border-b relative">
        <input v-model="busqueda" @input="buscar" @keydown="onKeydown" type="text" placeholder="Buscar @usuario o #sala"
          class="w-full border rounded-lg px-3 py-2" />

        <!-- lista unificada de sugerencias: usuarios, salas, y "crear sala" -->
        <div v-if="sugerencias.length" class="mt-2 space-y-1">
          <div v-for="(item, i) in sugerencias" :key="item.type + item.id"
            @mousedown.prevent="seleccionarSugerencia(item)" class="cursor-pointer p-2 rounded" :class="[
              themeStore.current.sidebarText,
              i === indiceSeleccionado ? 'bg-blue-100' : themeStore.current.sidebarHover
            ]">
            <span v-if="item.type === 'user'">@{{ item.label }}</span>
            <span v-else-if="item.type === 'room'">#{{ item.label }}</span>
            <span v-else class="text-blue-600">+ Crear sala "{{ item.label }}"</span>
          </div>
        </div>
      </div>

      <!-- Lista de salas/chats donde ya participa el usuario -->
      <div v-for="sala in roomsStore.salas" :key="sala.id" @click="roomsStore.seleccionarSala(sala)"
        class="p-3 cursor-pointer flex items-center gap-2" :class="[
          themeStore.current.sidebarText,
          roomsStore.salaActiva?.id === sala.id ? themeStore.current.sidebarActive : themeStore.current.sidebarHover
        ]">
        <!-- grupo -> icono genérico; individual -> avatar del otro usuario (o inicial si no tiene) -->
        <Users v-if="sala.type === 'group' && !sala.roomAvatar"
          class="w-8 h-8 rounded-full bg-gray-300 p-1.5 text-white shrink-0" />
        <img v-else-if="sala.type === 'group' && sala.roomAvatar" :src="sala.roomAvatar"
          class="w-8 h-8 rounded-full object-cover shrink-0" />
        <img v-else-if="sala.otherAvatar" :src="sala.otherAvatar" class="w-8 h-8 rounded-full object-cover shrink-0" />
        <div v-else
          class="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white shrink-0">
          {{ sala.displayName[0]?.toUpperCase() }}
        </div>

        <span class="flex-1">{{ sala.displayName }}</span>
        <Mail v-if="sala.hasUnread" class="text-orange-500 shrink-0" :size="16" />
      </div>
    </div>

    <div class="flex-1">
      <ChatWindow v-if="roomsStore.salaActiva" :sala="roomsStore.salaActiva" />
      <div v-else class="h-full flex items-center justify-center text-gray-400">
        Selecciona un chat para empezar
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoomsStore } from '../../stores/roomsStore.js'
import ChatWindow from '../../components/ChatWindow.vue'
import { Mail, Users } from '@lucide/vue'
import { useThemeStore } from '../../stores/themeStore'


const roomsStore = useRoomsStore()
const themeStore = useThemeStore()

const busqueda = ref('')
const resultadosUsuarios = ref([])
const resultadosSalas = ref([])
const mostrarCrearSala = ref(false) // true cuando buscas una #sala que no existe todavía
const nombreNuevaSala = ref('')
const indiceSeleccionado = ref(-1) // fila resaltada por teclado, -1 = ninguna

onMounted(() => {
  roomsStore.fetchSalas()
})

// lista unificada para pintar y navegar con flechas: usuarios, salas, y la opción de crear
const sugerencias = computed(() => {
  const lista = []
  resultadosUsuarios.value.forEach((u) => lista.push({ type: 'user', id: u.id, label: u.username }))
  resultadosSalas.value.forEach((s) => lista.push({ type: 'room', id: s.id, label: s.name }))
  if (mostrarCrearSala.value) {
    lista.push({ type: 'create', id: 'create', label: nombreNuevaSala.value })
  }
  return lista
})

// según el prefijo del texto, busca usuarios (@) o salas de grupo (#)
async function buscar() {
  const texto = busqueda.value.trim()
  resultadosUsuarios.value = []
  resultadosSalas.value = []
  mostrarCrearSala.value = false
  indiceSeleccionado.value = -1

  if (texto.startsWith('@')) {
    const query = texto.slice(1)
    if (query) resultadosUsuarios.value = await roomsStore.buscarUsuarios(query)
  } else if (texto.startsWith('#')) {
    const query = texto.slice(1)
    if (query) {
      resultadosSalas.value = await roomsStore.buscarSalas(query)
      const existeExacta = resultadosSalas.value.some(
        (s) => s.name.toLowerCase() === query.toLowerCase()
      )
      if (!existeExacta) {
        mostrarCrearSala.value = true
        nombreNuevaSala.value = query
      }
    }
  }
}

// navegación con teclado: flechas mueven la selección, Enter confirma la resaltada
function onKeydown(e) {
  if (!sugerencias.value.length) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    indiceSeleccionado.value = (indiceSeleccionado.value + 1) % sugerencias.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    indiceSeleccionado.value =
      indiceSeleccionado.value <= 0 ? sugerencias.value.length - 1 : indiceSeleccionado.value - 1
  } else if (e.key === 'Enter') {
    e.preventDefault()
    // si no habías movido las flechas, Enter actúa sobre la primera sugerencia
    const item = sugerencias.value[indiceSeleccionado.value] ?? sugerencias.value[0]
    if (item) seleccionarSugerencia(item)
  }
}

// ejecuta la acción correspondiente según el tipo de sugerencia (clic o Enter),
// y abre automáticamente el chat resultante (nuevo o existente)
async function seleccionarSugerencia(item) {
  let roomId

  if (item.type === 'user') {
    roomId = await roomsStore.crearIndividual(item.id)
  } else if (item.type === 'room') {
    roomId = await roomsStore.unirseGrupo(item.id)
  } else if (item.type === 'create') {
    roomId = await roomsStore.crearGrupo(item.label)
  }

  limpiarBusqueda()

  // como los métodos del store ya refrescan la lista (fetchSalas) antes de devolver el id,
  // aquí ya podemos encontrar la sala recién creada/unida dentro de roomsStore.salas
  const sala = roomsStore.salas.find((s) => s.id === roomId)
  if (sala) roomsStore.seleccionarSala(sala)
}

function limpiarBusqueda() {
  busqueda.value = ''
  resultadosUsuarios.value = []
  resultadosSalas.value = []
  mostrarCrearSala.value = false
  indiceSeleccionado.value = -1
}
</script>