<template>
    <div class="w-full h-full flex flex-col bg-gray-600 p-3 gap-2">
        <!-- cabecera: nombre de la sala + acción según el tipo -->
        <div class="flex justify-between items-center">
            <p class="text-white font-semibold">{{ sala.displayName }}</p>
            <Info v-if="sala.type === 'group'" @click="showRoomInfo = true" class="text-white cursor-pointer"
                :size="20" />
            <Trash2 v-if="sala.type === 'individual'" @click="eliminarChat" class="text-white cursor-pointer"
                :size="20" />
        </div>

        <div ref="contenedorMensajes" class="w-full flex-1 bg-amber-100 overflow-y-auto p-4 flex flex-col gap-2">
            <div v-for="msg in mensajes" :key="msg.id"
                :class="msg.user_id === authStore.usuario?.id ? 'ml-auto bg-blue-500 text-white' : 'mr-auto bg-rose-500'"
                class="px-4 py-2 rounded-2xl max-w-[70%]">
                <p class="text-xs opacity-70">{{ msg.username }}</p>
                {{ msg.content }}
            </div>
        </div>

        <div class="w-full flex flex-row justify-between items-center gap-3 shrink-0">
            <input v-model="nuevoMensaje" @keyup.enter="enviarMensaje" type="text"
                class="w-full rounded-full px-4 py-2">
            <button @click="enviarMensaje" class="p-3 rounded-full bg-green-500">
                <Send class="text-white" />
            </button>
        </div>
        <RoomInfo v-if="showRoomInfo" :sala="sala" @close="showRoomInfo = false" />
    </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { Send, Info, Trash2 } from '@lucide/vue'
import { useSocket } from '../composables/useSocket'
import { useAuthStore } from '../stores/authStore'
import RoomInfo from './RoomInfo.vue'
import { API_URL } from '../config'
import { useRoomsStore } from '../stores/roomsStore'

const props = defineProps({
    sala: { type: Object, required: true }
})

const authStore = useAuthStore()
const { mensajes, unirseSala, enviarMensaje: enviarPorSocket, escucharMensajes } = useSocket()

const nuevoMensaje = ref('')
const contenedorMensajes = ref(null)

const showRoomInfo = ref(false)
const roomsStore = useRoomsStore()

// carga el historial de la sala desde la BBDD (vía REST)
async function cargarHistorial(roomId) {
    const res = await fetch(`${API_URL}/messages/room/${roomId}/${authStore.usuario.id}`)
    mensajes.value = await res.json()
    scrollAbajo()
}

// Eliminar chats tanto individuales como grupales
async function eliminarChat() {
    if (!confirm('¿Eliminar este chat? Solo se borrará de tu lista.')) return
    await roomsStore.abandonarSala(props.sala.id)
}

// cada vez que cambia la sala activa, nos unimos a la nueva y cargamos su historial
watch(() => props.sala.id, (nuevoId) => {
    if (nuevoId) {
        unirseSala(nuevoId)
        cargarHistorial(nuevoId)
    }
}, { immediate: true })

// escuchamos mensajes nuevos que lleguen por socket
escucharMensajes((msg) => {
    if (msg.room_id === props.sala.id) {
        mensajes.value.push(msg)
        scrollAbajo()
    }
})

function enviarMensaje() {
    if (!nuevoMensaje.value.trim() || !authStore.usuario) return
    enviarPorSocket({
        roomId: props.sala.id,
        userId: authStore.usuario.id,
        username: authStore.usuario.username,
        content: nuevoMensaje.value,
    })
    nuevoMensaje.value = ''
}

function scrollAbajo() {
    nextTick(() => {
        const el = contenedorMensajes.value
        if (el) el.scrollTop = el.scrollHeight
    })
}
</script>