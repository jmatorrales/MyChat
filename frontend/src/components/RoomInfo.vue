<template>
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="$emit('close')">
        <div class="bg-white rounded-lg w-[420px] max-h-[80vh] overflow-y-auto p-6 flex flex-col gap-4">

            <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold">{{ sala.displayName }}</h2>
                <X @click="$emit('close')" class="cursor-pointer" />
            </div>

            <!-- Invitación: enlace + QR -->
            <div class="flex flex-col items-center gap-2 border-b pb-4">
                <p class="text-sm text-gray-500">Invita a otras personas a esta sala</p>
                <img v-if="qr" :src="qr" alt="QR de invitación" class="w-40 h-40" />
                <div class="flex w-full gap-2">
                    <input :value="inviteUrl" readonly
                        class="flex-1 border rounded px-2 py-1 text-sm transition-colors duration-300"
                        :class="copiado ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 text-gray-600'" />
                    <button @click="copiarEnlace" class="text-sm px-3 rounded transition-colors duration-300"
                        :class="copiado ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'">
                        {{ copiado ? 'Copiado ✓' : 'Copiar' }}
                    </button>
                </div>
            </div>

            <!-- Buscador para añadir nuevos integrantes directamente -->
            <div class="border-b pb-4">
                <p class="text-sm text-gray-500 mb-2">Añadir integrante</p>
                <input v-model="busquedaUsuario" @input="buscarParaAnadir" type="text" placeholder="Buscar usuario..."
                    class="w-full border rounded-lg px-2 py-1 text-sm" />
                <div v-if="resultadosBusqueda.length" class="mt-2 space-y-1">
                    <div v-for="user in resultadosBusqueda" :key="user.id" @click="anadirIntegrante(user.id)"
                        class="cursor-pointer p-2 text-sm hover:bg-gray-100 rounded">
                        + {{ user.username }}
                    </div>
                </div>
            </div>

            <!-- Lista de integrantes -->
            <div>
                <p class="text-sm text-gray-500 mb-2">Integrantes</p>
                <div v-for="user in usuarios" :key="user.id" class="flex justify-between items-center py-1">
                    <span>
                        {{ user.username }}
                        <!-- "(Tú)" solo para identificarte a ti mismo en la lista, y solo en grupos -->
                        <span v-if="user.id === authStore.usuario.id" class="text-xs text-gray-400">(Tú)</span>
                        <span v-if="user.id === info?.created_by" class="text-xs text-gray-400">(creador)</span>
                    </span>
                    <button v-if="esCreador && user.id !== authStore.usuario.id" @click="expulsar(user.id)"
                        class="text-xs text-red-600 hover:underline">
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
import { X } from '@lucide/vue'
import { useRoomsStore } from '../stores/roomsStore'
import { useAuthStore } from '../stores/authStore'

const props = defineProps({
    sala: { type: Object, required: true }
})
const emit = defineEmits(['close'])

const roomsStore = useRoomsStore()
const authStore = useAuthStore()

const info = ref(null)
const usuarios = ref([])
const qr = ref(null)
const copiado = ref(false)

// buscador para añadir integrantes nuevos directamente desde este panel
const busquedaUsuario = ref('')
const resultadosBusqueda = ref([])

const inviteUrl = computed(() => `${window.location.origin}/app/join/${props.sala.id}`)
const esCreador = computed(() => info.value && authStore.usuario.id === info.value.created_by)

onMounted(async () => {
    const data = await roomsStore.fetchRoomInfo(props.sala.id)
    info.value = data
    usuarios.value = data.usuarios
    qr.value = await roomsStore.getQR(inviteUrl.value)
})

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