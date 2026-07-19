<template>
    <div class="w-full h-full flex flex-col gap-2 min-h-0 bg-center bg-cover" :class="[
        authStore.usuario.bg_type === 'solid' ? themeStore.current.chatBg : 'bg-contain'
    ]" :style="fondoStyle">
        <!-- cabecera con fondo del "headerBg", contrasta con el fondo del chat -->
        <div class="flex justify-between items-center p-3"
            :class="[themeStore.current.headerBg, themeStore.current.headerText]">
            <p class="font-semibold">{{ sala.displayName }}</p>
            <Info v-if="sala.type === 'group'" @click="showRoomInfo = true" class="cursor-pointer" :size="20" />
            <Trash2 v-if="sala.type === 'individual'" @click="eliminarChat" class="cursor-pointer" :size="20" />
        </div>

        <!-- overflow-x-hidden: si algo intenta desbordarse por ancho, se queda contenido aquí
             y no arrastra scroll horizontal a toda la app (lista de salas, cabecera, etc.) -->
        <div ref="contenedorMensajes" class="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-2">
            <template v-for="msg in mensajes" :key="msg.id">
                <!-- ============ BURBUJA DE GRUPO (con avatar) ============
                     max-w-[75%] + min-w-0 van en el contenedor flex EXTERIOR (fila avatar+burbuja):
                     sin min-w-0 aquí, Flexbox no deja que la fila se encoja por debajo del contenido,
                     aunque tenga max-w puesto (bug clásico de Flexbox).
                     break-all: rompe la línea incluso en medio de una palabra/cadena sin espacios
                     (necesario para mensajes tipo "aaaaaaaaaa..." que no tienen ningún punto de corte natural).
                     El redondeo es asimétrico: la esquina pegada al avatar queda recta ("pico"),
                     simulando el efecto bocadillo de chat sin necesidad de CSS extra -->
                <div v-if="sala.type === 'group'" class="flex items-start gap-2 max-w-[75%] min-w-0"
                    :class="msg.user_id === authStore.usuario?.id ? 'ml-auto flex-row-reverse' : 'mr-auto'">
                    <img v-if="msg.user_id !== authStore.usuario?.id && msg.avatar" :src="msg.avatar"
                        class="w-6 h-6 rounded-full object-cover shrink-0" />
                    <div v-else-if="msg.user_id !== authStore.usuario?.id"
                        class="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white shrink-0">
                        {{ msg.username[0].toUpperCase() }}
                    </div>
                    <div :class="[
                        msg.user_id === authStore.usuario?.id
                            ? themeStore.current.bubbleMe + ' rounded-tl-2xl rounded-bl-2xl rounded-br-2xl'
                            : themeStore.current.bubbleOther + ' rounded-tr-2xl rounded-br-2xl rounded-bl-2xl'
                    ]" class="px-4 py-2 min-w-0 break-all">
                        <p class="text-xs opacity-70">{{ msg.username }}</p>
                        {{ msg.content }}
                    </div>
                </div>

                <!-- ============ BURBUJA INDIVIDUAL (sin avatar) ============
                     Aquí no hay fila extra (no hay avatar), así que max-w-[75%] va directo
                     en la propia burbuja. break-all por la misma razón que en la de grupo -->
                <div v-else
                    :class="msg.user_id === authStore.usuario?.id ? 'ml-auto ' + themeStore.current.bubbleMe : 'mr-auto ' + themeStore.current.bubbleOther"
                    class="px-4 py-2 rounded-2xl max-w-[75%] break-all">
                    {{ msg.content }}
                </div>
            </template>
        </div>

        <!-- barra de escritura: emojis + textarea auto-expandible + enviar -->
        <div class="w-full flex flex-row justify-between items-end gap-3 shrink-0 relative p-3">
            <!-- botón de emojis: usa headerBg para que combine con la cabecera -->
            <button ref="emojiButton" @click="showEmojiPicker = !showEmojiPicker" type="button"
                class="p-3 rounded-full shrink-0" :class="[themeStore.current.headerBg, themeStore.current.headerText]">
                <Smile :size="20" />
            </button>

            <!-- panel de emojis: reutiliza los tokens de la sidebar (fondo + hover) -->
            <div v-if="showEmojiPicker" ref="emojiPanel"
                class="absolute bottom-16 left-0 rounded-lg shadow-lg p-3 grid grid-cols-6 gap-1 w-64 max-h-52 overflow-y-auto z-10"
                :class="themeStore.current.sidebarBg">
                <button v-for="emoji in emojis" :key="emoji" @click="insertarEmoji(emoji)" type="button"
                    class="text-xl rounded p-1" :class="themeStore.current.sidebarHover">
                    {{ emoji }}
                </button>
            </div>

            <!-- textarea en vez de input: empieza en 1 línea (rows="1") y crece con @input
                 hasta max-h-32, momento en el que empieza a hacer scroll interno en vez de seguir creciendo.
                 Enter envía el mensaje, Shift+Enter hace salto de línea normal (ver onKeydownMensaje) -->
            <textarea ref="textareaMensaje" v-model="nuevoMensaje" @keydown="onKeydownMensaje" @input="ajustarAltura"
                rows="1" placeholder="Escribe un mensaje..."
                class="w-full rounded-2xl px-4 py-2 border resize-none overflow-y-auto max-h-32 leading-normal no-scrollbar"
                :class="[themeStore.current.inputBg, themeStore.current.inputText]"></textarea>

            <button @click="enviarMensaje" class="p-3 rounded-full shrink-0" :class="themeStore.current.btn">
                <Send />
            </button>
        </div>

        <RoomInfo v-if="showRoomInfo" :sala="sala" @close="showRoomInfo = false" />
    </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted, computed } from 'vue'
import { Send, Info, Trash2, Smile } from '@lucide/vue'
import { useSocket } from '../composables/useSocket'
import { useAuthStore } from '../stores/authStore'
import { useRoomsStore } from '../stores/roomsStore'
import { useThemeStore } from '../stores/themeStore'
import RoomInfo from './RoomInfo.vue'
import { API_URL } from '../config'
import { apiFetch } from '../config'

const props = defineProps({
    sala: { type: Object, required: true }
})

const authStore = useAuthStore()
const roomsStore = useRoomsStore()
const themeStore = useThemeStore()
const { mensajes, unirseSala, enviarMensaje: enviarPorSocket, escucharMensajes } = useSocket()

const nuevoMensaje = ref('')
const contenedorMensajes = ref(null)
const textareaMensaje = ref(null) // referencia al textarea, para poder medir y ajustar su altura
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
    nextTick(() => ajustarAltura()) // el emoji puede hacer que el texto ya no quepa en una línea
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

// cada vez que cambia la sala activa, nos unimos a la nueva y cargamos su historial
watch(() => props.sala.id, (nuevoId) => {
    if (nuevoId) {
        unirseSala(nuevoId)
        cargarHistorial(nuevoId)
    }
}, { immediate: true })

// calcula el estilo inline del fondo: solo se usa cuando hay imagen (preset o custom)
const fondoStyle = computed(() => {
    const { bg_type, bg_value } = authStore.usuario
    if (bg_type === 'preset' || bg_type === 'custom') {
        return { backgroundImage: `url(${bg_value})` }
    }
    return {} // "solid" -> sin imagen, usa la clase de color del tema
})

// carga el historial de la sala desde la BBDD (vía REST)
async function cargarHistorial(roomId) {
    const res = await apiFetch(`/messages/room/${roomId}/${authStore.usuario.id}`)
    mensajes.value = await res.json()
    scrollAbajo()
}

async function eliminarChat() {
    if (!confirm('¿Eliminar este chat? Solo se borrará de tu lista.')) return
    await roomsStore.abandonarSala(props.sala.id)
}

// escuchamos mensajes nuevos que lleguen por socket
escucharMensajes((msg) => {
    if (msg.room_id === props.sala.id) {
        mensajes.value.push(msg)
        scrollAbajo()
    }
})

// Enter envía el mensaje; Shift+Enter hace un salto de línea normal dentro del textarea
function onKeydownMensaje(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        enviarMensaje()
    }
}

// ajusta la altura del textarea al contenido real, respetando el límite max-h-32 marcado por CSS
function ajustarAltura() {
    const el = textareaMensaje.value
    if (!el) return
    el.style.height = 'auto' // reseteamos primero para poder medir el scrollHeight real (si no, solo crecería)
    el.style.height = el.scrollHeight + 'px'
}

function enviarMensaje() {
    if (!nuevoMensaje.value.trim() || !authStore.usuario) return
    enviarPorSocket({
        roomId: props.sala.id,
        userId: authStore.usuario.id,
        username: authStore.usuario.username,
        avatar: authStore.usuario.avatar,
        content: nuevoMensaje.value,
    })
    nuevoMensaje.value = ''
    showEmojiPicker.value = false // cerramos el panel al enviar, por limpieza
    nextTick(() => ajustarAltura()) // volvemos a la altura de una línea tras vaciar el campo
}

function scrollAbajo() {
    nextTick(() => {
        const el = contenedorMensajes.value
        if (el) el.scrollTop = el.scrollHeight
    })
}
</script>