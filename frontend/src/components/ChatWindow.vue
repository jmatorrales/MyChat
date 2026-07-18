<template>
    <div class="w-full h-full flex flex-col bg-gray-600 p-3 gap-2">
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

        <!-- barra de escritura: emojis + input + enviar -->
        <div class="w-full flex flex-row justify-between items-center gap-3 shrink-0 relative">
            <!-- botón para abrir/cerrar el selector de emojis (ref para poder excluirlo del "clic fuera") -->
            <button ref="emojiButton" @click="showEmojiPicker = !showEmojiPicker" type="button"
                class="p-3 rounded-full bg-gray-400 hover:bg-gray-300 shrink-0">
                <Smile class="text-white" :size="20" />
            </button>

            <!-- panel de emojis: se posiciona justo encima del botón -->
            <div v-if="showEmojiPicker" ref="emojiPanel"
                class="absolute bottom-16 left-0 bg-white rounded-lg shadow-lg p-3 grid grid-cols-6 gap-1 w-64 max-h-52 overflow-y-auto z-10">
                <button v-for="emoji in emojis" :key="emoji" @click="insertarEmoji(emoji)" type="button"
                    class="text-xl hover:bg-gray-100 rounded p-1">
                    {{ emoji }}
                </button>
            </div>

            <input v-model="nuevoMensaje" @keyup.enter="enviarMensaje" type="text"
                class="w-full rounded-full px-4 py-2">
            <button @click="enviarMensaje" class="p-3 rounded-full bg-green-500 shrink-0">
                <Send class="text-white" />
            </button>
        </div>

        <RoomInfo v-if="showRoomInfo" :sala="sala" @close="showRoomInfo = false" />
    </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { Send, Info, Trash2, Smile } from '@lucide/vue'
import { useSocket } from '../composables/useSocket'
import { useAuthStore } from '../stores/authStore'
import { useRoomsStore } from '../stores/roomsStore'
import RoomInfo from './RoomInfo.vue'
import { API_URL } from '../config'

const props = defineProps({
    sala: { type: Object, required: true }
})

const authStore = useAuthStore()
const roomsStore = useRoomsStore()
const { mensajes, unirseSala, enviarMensaje: enviarPorSocket, escucharMensajes } = useSocket()

const nuevoMensaje = ref('')
const contenedorMensajes = ref(null)
const showRoomInfo = ref(false)

// --- selector de emojis ---
const showEmojiPicker = ref(false)
const emojiPanel = ref(null)   // referencia al panel, para detectar clics fuera de él
const emojiButton = ref(null)  // referencia al botón que abre/cierra, para excluirlo del "clic fuera"
// set básico de emojis comunes; se puede ampliar cuando queramos
const emojis = [
    '😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👎', '🙏',
    '👏', '🔥', '🎉', '❤️', '💀', '😴', '🥳', '😱', '🤝', '👀',
    '🚀', '✅', '❌', '⭐', '💡', '📌', '🎮', '🍕', '☕', '🐱'
]

// añade el emoji pulsado al final del texto; no cerramos el panel para poder meter varios seguidos
function insertarEmoji(emoji) {
    nuevoMensaje.value += emoji
}

// cierra el panel si el clic fue fuera del panel Y fuera del botón que lo abre
// (sin excluir el botón, el mismo clic que lo abre lo cerraría al instante, porque
// este listener de document también se dispara para ese clic)
function handleClickFuera(e) {
    const fueraDelPanel = emojiPanel.value && !emojiPanel.value.contains(e.target)
    const fueraDelBoton = emojiButton.value && !emojiButton.value.contains(e.target)

    // si no hay panel abierto, emojiPanel.value es null -> tratamos "fuera del panel" como true
    const clicRealmenteFuera = (!emojiPanel.value || fueraDelPanel) && fueraDelBoton

    if (clicRealmenteFuera) {
        showEmojiPicker.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickFuera)
})
onUnmounted(() => {
    document.removeEventListener('click', handleClickFuera)
})

// carga el historial de la sala desde la BBDD (vía REST)
async function cargarHistorial(roomId) {
    const res = await fetch(`${API_URL}/messages/room/${roomId}/${authStore.usuario.id}`)
    mensajes.value = await res.json()
    scrollAbajo()
}

async function eliminarChat() {
    if (!confirm('¿Eliminar este chat? Solo se borrará de tu lista.')) return
    await roomsStore.abandonarSala(props.sala.id)
}

watch(() => props.sala.id, (nuevoId) => {
    if (nuevoId) {
        unirseSala(nuevoId)
        cargarHistorial(nuevoId)
    }
}, { immediate: true })

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
    showEmojiPicker.value = false // cerramos el panel al enviar, por limpieza
}

function scrollAbajo() {
    nextTick(() => {
        const el = contenedorMensajes.value
        if (el) el.scrollTop = el.scrollHeight
    })
}
</script>