<template>
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="$emit('close')">
        <!-- fondo y texto del panel según el tema activo (soporta modo oscuro) -->
        <div class="rounded-lg w-[420px] max-h-[80vh] overflow-y-auto p-6 flex flex-col gap-4"
            :class="[themeStore.current.chatBg, themeStore.current.sidebarText]">

            <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold">{{ sala.displayName }}</h2>
                <X @click="$emit('close')" class="cursor-pointer" />
            </div>

            <!-- Imagen del grupo: clic en cualquier parte (imagen, placeholder o icono cámara) abre el selector -->
            <div class="flex flex-col items-center gap-2 border-b pb-4">
                <div class="relative group cursor-pointer" @click="$refs.groupAvatarInput.click()">
                    <img v-if="roomAvatarLocal" :src="roomAvatarLocal"
                        class="w-20 h-20 rounded-full object-cover group-hover:opacity-75 transition-opacity" />
                    <div v-else
                        class="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl text-white font-semibold group-hover:opacity-75 transition-opacity">
                        {{ sala.displayName[0].toUpperCase() }}
                    </div>
                    <div
                        class="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 shadow group-hover:bg-blue-700">
                        <Camera :size="14" />
                    </div>
                </div>
                <input ref="groupAvatarInput" type="file" accept="image/*" class="hidden" @change="subirAvatarGrupo" />
            </div>

            <!-- Invitación: enlace + QR -->
            <div class="flex flex-col items-center gap-2 border-b pb-4">
                <p class="text-sm opacity-70">Invita a otras personas a esta sala</p>
                <img v-if="qr" :src="qr" alt="QR de invitación" class="w-40 h-40" />
                <div class="flex w-full gap-2">
                    <input :value="inviteUrl" readonly
                        class="flex-1 border rounded px-2 py-1 text-sm transition-colors duration-300"
                        :class="copiado ? 'border-green-500 bg-green-50 text-green-700' : themeStore.current.inputBg + ' ' + themeStore.current.inputText" />
                    <button @click="copiarEnlace" class="text-sm px-3 rounded transition-colors duration-300"
                        :class="copiado ? 'bg-green-500 text-white' : themeStore.current.sidebarHover">
                        {{ copiado ? 'Copiado ✓' : 'Copiar' }}
                    </button>
                </div>
            </div>

            <!-- Buscador para añadir nuevos integrantes directamente -->
            <div class="border-b pb-4">
                <p class="text-sm opacity-70 mb-2">Añadir integrante</p>
                <input v-model="busquedaUsuario" @input="buscarParaAnadir" type="text" placeholder="Buscar usuario..."
                    class="w-full border rounded-lg px-2 py-1 text-sm"
                    :class="[themeStore.current.inputBg, themeStore.current.inputText]" />
                <div v-if="resultadosBusqueda.length" class="mt-2 space-y-1">
                    <div v-for="user in resultadosBusqueda" :key="user.id" @click="anadirIntegrante(user.id)"
                        class="cursor-pointer p-2 text-sm rounded" :class="themeStore.current.sidebarHover">
                        + {{ user.username }}
                    </div>
                </div>
            </div>

            <!-- Lista de integrantes -->
            <div>
                <p class="text-sm opacity-70 mb-2">Integrantes</p>
                <div v-for="user in usuarios" :key="user.id" class="flex justify-between items-center py-1">
                    <span>
                        {{ user.username }}
                        <!-- "(Tú)" solo para identificarte a ti mismo en la lista -->
                        <span v-if="user.id === authStore.usuario.id" class="text-xs opacity-50">(Tú)</span>
                        <span v-if="user.id === info?.created_by" class="text-xs opacity-50">(creador)</span>
                    </span>
                    <button v-if="esCreador && user.id !== authStore.usuario.id" @click="expulsar(user.id)"
                        class="text-xs text-red-500 hover:underline">
                        Expulsar
                    </button>
                </div>
            </div>

            <button @click="abandonar"
                class="mt-4 w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded-lg">
                Abandonar sala
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { X, Camera } from '@lucide/vue'
import { useRoomsStore } from '../stores/roomsStore'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'

const props = defineProps({
    sala: { type: Object, required: true }
})
const emit = defineEmits(['close'])

const roomsStore = useRoomsStore()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const info = ref(null)      // datos de la sala (created_by, etc.)
const usuarios = ref([])    // miembros de la sala
const qr = ref(null)
const copiado = ref(false)

// buscador para añadir integrantes nuevos directamente desde este panel
const busquedaUsuario = ref('')
const resultadosBusqueda = ref([])

// copia local del avatar de la sala: la prop "sala" no se actualiza sola al subir una imagen nueva
// (viene de un array distinto en roomsStore.salas), así que reflejamos el cambio aquí manualmente
const roomAvatarLocal = ref(props.sala.roomAvatar)

const inviteUrl = computed(() => `${window.location.origin}/app/join/${props.sala.id}`)
const esCreador = computed(() => info.value && authStore.usuario.id === info.value.created_by)

onMounted(async () => {
    const data = await roomsStore.fetchRoomInfo(props.sala.id)
    info.value = data
    usuarios.value = data.usuarios
    qr.value = await roomsStore.getQR(inviteUrl.value)
})

// convierte la imagen elegida a base64, la guarda en backend, y actualiza la preview local al instante
function subirAvatarGrupo(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
        await roomsStore.updateRoomAvatar(props.sala.id, reader.result)
        roomAvatarLocal.value = reader.result
    }
    reader.readAsDataURL(file)
}

async function buscarParaAnadir() {
    if (!busquedaUsuario.value.trim()) {
        resultadosBusqueda.value = []
        return
    }
    const resultados = await roomsStore.buscarUsuarios(busquedaUsuario.value)
    // excluimos a quienes ya están en la sala, para no ofrecer añadir a alguien duplicado
    const idsActuales = usuarios.value.map((u) => u.id)
    resultadosBusqueda.value = resultados.filter((u) => !idsActuales.includes(u.id))
}

async function anadirIntegrante(userId) {
    await roomsStore.anadirAOtroUsuario(props.sala.id, userId)
    const data = await roomsStore.fetchRoomInfo(props.sala.id)
    usuarios.value = data.usuarios
    busquedaUsuario.value = ''
    resultadosBusqueda.value = []
}

async function expulsar(userId) {
    await roomsStore.removeUser(props.sala.id, userId)
    usuarios.value = usuarios.value.filter(u => u.id !== userId)
}

async function abandonar() {
    await roomsStore.abandonarSala(props.sala.id)
    emit('close')
}

async function copiarEnlace() {
    try {
        await navigator.clipboard.writeText(inviteUrl.value)
    } catch (err) {
        // fallback para contextos no seguros (http en red local, donde el navegador bloquea la Clipboard API)
        const temp = document.createElement('textarea')
        temp.value = inviteUrl.value
        document.body.appendChild(temp)
        temp.select()
        document.execCommand('copy')
        document.body.removeChild(temp)
    }
    copiado.value = true
    setTimeout(() => (copiado.value = false), 2000)
}
</script>