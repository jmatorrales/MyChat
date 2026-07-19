<template>
    <div v-if="uiStore.showSettings" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
        @click.self="uiStore.toggleSettings()">
        <!-- contenedor principal del modal: ocupa toda la pantalla en móvil,
             y se centra con tamaño fijo (w-3/4 h-3/4) desde md: en adelante.
             flex-col en móvil (menú arriba, contenido abajo) / flex-row en desktop (menú al lado) -->
        <div class="rounded-lg w-full h-full md:w-3/4 md:h-3/4 flex flex-col md:flex-row overflow-hidden"
            :class="themeStore.current.chatBg">

            <!-- Menú lateral: fila horizontal en móvil (los 3 items uno al lado del otro),
                 columna vertical en desktop -->
            <div class="flex flex-row md:flex-col items-center md:items-stretch justify-between md:justify-start p-4 gap-2 md:space-y-2 md:gap-0"
                :class="[themeStore.current.sidebarBg, themeStore.current.sidebarText]">
                <button @click="uiStore.toggleSettings()" class="order-first md:order-none">
                    <X />
                </button>
                <p @click="section = 'appearance'" :class="section === 'appearance' ? 'font-semibold' : 'opacity-50'"
                    class="cursor-pointer flex gap-2 text-sm md:text-base">
                    <Palette /> <span class="hidden sm:inline">Apariencia</span>
                </p>
                <p @click="section = 'user'" :class="section === 'user' ? 'font-semibold' : 'opacity-50'"
                    class="cursor-pointer flex gap-2 text-sm md:text-base">
                    <User /> <span class="hidden sm:inline">Usuario</span>
                </p>
                <p @click="section = 'info'" :class="section === 'info' ? 'font-semibold' : 'opacity-50'"
                    class="cursor-pointer flex gap-2 text-sm md:text-base">
                    <Info /> <span class="hidden sm:inline">Info</span>
                </p>
            </div>

            <!-- Contenido -->
            <div class="flex-1 p-6 overflow-y-auto" :class="themeStore.current.sidebarText">

                <!-- ================= APARIENCIA ================= -->
                <div v-if="section === 'appearance'" class="flex flex-col gap-5">
                    <!-- selector de tema: un botón por cada key de themeStore.themes, coloreado con su "swatch" -->
                    <div>
                        <p class="mb-2">Elige un tema:</p>
                        <div class="grid grid-cols-4 gap-3">
                            <button v-for="key in Object.keys(themeStore.themes)" :key="key"
                                @click="themeStore.setTheme(key)"
                                class="h-14 rounded-lg border-2 transition-transform hover:scale-105"
                                :class="[themeStore.themes[key].swatch, themeStore.theme === key ? 'border-black' : 'border-transparent']"
                                :title="key">
                            </button>
                        </div>
                    </div>

                    <!-- selector de fondo de chat: color liso, presets por tema, o imagen personalizada -->
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <p>Fondo del chat:</p>
                            <!-- solo se muestra "Restablecer" si el fondo activo no es ya el color liso -->
                            <button v-if="authStore.usuario.bg_type !== 'solid'" @click="elegirSolido"
                                class="text-xs text-gray-500 hover:underline">
                                Restablecer
                            </button>
                        </div>

                        <div class="grid grid-cols-4 gap-2">
                            <!-- una miniatura por cada tema preset (frontend/public/backgrounds/{key}.jpg) -->
                            <div v-for="key in Object.keys(themeStore.themes)" :key="key" class="relative">
                                <img :src="`/backgrounds/${key}.jpg`" @click="elegirPreset(key)"
                                    class="h-14 w-full object-cover rounded cursor-pointer"
                                    :class="esPresetActivo(key) ? 'ring-2 ring-black' : ''" />
                            </div>

                            <!-- casilla de imagen personalizada: si NO hay una subida, muestra un "+";
                                 si YA hay una (bg_type === 'custom'), esa misma casilla se convierte en preview -->
                            <div class="relative">
                                <div v-if="authStore.usuario.bg_type !== 'custom'" @click="$refs.fileInput.click()"
                                    class="h-14 w-full flex items-center justify-center border-2 border-dashed rounded cursor-pointer text-gray-400 hover:text-gray-600 hover:border-gray-500">
                                    <Plus :size="20" />
                                </div>
                                <img v-else :src="authStore.usuario.bg_value" @click="$refs.fileInput.click()"
                                    class="h-14 w-full object-cover rounded cursor-pointer ring-2 ring-black" />
                            </div>
                        </div>

                        <!-- input real oculto; se activa por clic en la casilla de arriba -->
                        <input ref="fileInput" type="file" accept="image/*" class="hidden"
                            @change="subirPersonalizado" />
                        <p class="text-xs text-gray-400 mt-1">Personalizado: haz clic en el recuadro con "+" para subir
                            tu imagen</p>
                    </div>
                </div>

                <!-- ================= USUARIO ================= -->
                <div v-else-if="section === 'user'" class="flex flex-col pt-10 gap-6 max-w-sm mx-auto">
                    <!-- Avatar: si el usuario ya tiene uno se muestra la imagen, si no, un círculo
                         con su inicial como placeholder. El icono de cámara abre el selector de archivo -->
                    <div class="flex flex-col items-center gap-2">
                        <div class="relative group cursor-pointer" @click="$refs.avatarInput.click()">
                            <img v-if="authStore.usuario.avatar" :src="authStore.usuario.avatar"
                                class="w-24 h-24 rounded-full object-cover group-hover:opacity-75 transition-opacity" />
                            <div v-else
                                class="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-3xl text-white font-semibold group-hover:opacity-75 transition-opacity">
                                {{ authStore.usuario.username[0].toUpperCase() }}
                            </div>
                            <div class="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 shadow">
                                <Camera :size="14" />
                            </div>
                        </div>
                        <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="subirAvatar" />
                        <p class="font-semibold text-lg">{{ authStore.usuario.username }}</p>
                    </div>

                    <!-- Cambiar email: input precargado con el email actual + botón guardar -->
                    <div class="border-t pt-4">
                        <p class="text-sm text-gray-500 mb-2">Email</p>
                        <div class="flex gap-2">
                            <input v-model="nuevoEmail" type="email"
                                class="flex-1 border rounded-lg px-3 py-2 text-sm text-gray-500" />
                            <button @click="guardarEmail"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg text-sm">
                                Guardar
                            </button>
                        </div>
                        <p v-if="mensajeEmail" class="text-xs mt-1"
                            :class="errorEmail ? 'text-red-600' : 'text-green-600'">
                            {{ mensajeEmail }}
                        </p>
                    </div>

                    <!-- Cambiar contraseña: exige la actual + la nueva, el backend verifica la actual -->
                    <div class="border-t pt-4">
                        <p class="text-sm text-gray-500 mb-2">Cambiar contraseña</p>
                        <input v-model="passwordActual" type="password" placeholder="Contraseña actual"
                            class="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
                        <input v-model="passwordNueva" type="password" placeholder="Nueva contraseña"
                            class="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
                        <button @click="guardarPassword"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm w-full">
                            Actualizar contraseña
                        </button>
                        <p v-if="mensajePassword" class="text-xs mt-1"
                            :class="errorPassword ? 'text-red-600' : 'text-green-600'">
                            {{ mensajePassword }}
                        </p>
                    </div>
                </div>

                <!-- ================= INFO ================= -->
                <div v-else-if="section === 'info'" class="flex flex-col gap-2 text-sm opacity-80">
                    <p class="font-semibold text-base">MyChat</p>
                    <p>Versión 1.0.0</p>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { X, Palette, User, Plus, Camera, Info } from '@lucide/vue'
import { useThemeStore } from '../stores/themeStore'
import { useUiStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'

const themeStore = useThemeStore()
const uiStore = useUiStore()
const authStore = useAuthStore()

const section = ref('appearance') // apartado activo del modal, por defecto apariencia

// ---------- FONDO DE CHAT ----------

// activa el color liso del tema como fondo
function elegirSolido() {
    authStore.updateBackground('solid', null)
}

// activa la imagen preset del tema indicado
function elegirPreset(themeKey) {
    authStore.updateBackground('preset', `/backgrounds/${themeKey}.jpg`)
}

// true si el preset mostrado es el que está activo ahora mismo
function esPresetActivo(themeKey) {
    return authStore.usuario.bg_type === 'preset' && authStore.usuario.bg_value === `/backgrounds/${themeKey}.jpg`
}

// convierte el archivo elegido a base64 y lo guarda como fondo personalizado
function subirPersonalizado(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
        authStore.updateBackground('custom', reader.result) // reader.result ya es un data URL base64
    }
    reader.readAsDataURL(file)
}

// ---------- AVATAR ----------

// convierte la foto elegida a base64 y la guarda como avatar del usuario
function subirAvatar(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => authStore.updateAvatar(reader.result)
    reader.readAsDataURL(file)
}

// ---------- EMAIL ----------

const nuevoEmail = ref(authStore.usuario.email) // precargado con el email actual
const mensajeEmail = ref('')   // feedback tras guardar (éxito o error)
const errorEmail = ref(false)  // true si el último intento falló (pinta el mensaje en rojo)

async function guardarEmail() {
    mensajeEmail.value = ''
    try {
        await authStore.updateEmail(nuevoEmail.value)
        errorEmail.value = false
        mensajeEmail.value = 'Email actualizado ✓'
    } catch (err) {
        errorEmail.value = true
        mensajeEmail.value = err.message
    }
}

// ---------- CONTRASEÑA ----------

const passwordActual = ref('')
const passwordNueva = ref('')
const mensajePassword = ref('')
const errorPassword = ref(false)

async function guardarPassword() {
    mensajePassword.value = ''

    // ambas contraseñas son obligatorias antes de llamar al backend
    if (!passwordActual.value.trim() || !passwordNueva.value.trim()) {
        errorPassword.value = true
        mensajePassword.value = 'Debes rellenar ambos campos'
        return
    }

    try {
        await authStore.updatePassword(passwordActual.value, passwordNueva.value)
        errorPassword.value = false
        mensajePassword.value = 'Contraseña actualizada ✓'
        passwordActual.value = ''
        passwordNueva.value = ''
    } catch (err) {
        errorPassword.value = true
        mensajePassword.value = err.message
    }
}
</script>