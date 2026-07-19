<template>
    <div v-if="uiStore.showSettings" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
        @click.self="uiStore.toggleSettings()">
        <div class="bg-white rounded-lg w-3/4 h-3/4 flex overflow-hidden">

            <!-- Menú lateral -->
            <div class="w-1/4 bg-gray-100 p-4 space-y-2">
                <button @click="uiStore.toggleSettings()">
                    <X />
                </button>
                <p @click="section = 'appearance'"
                    :class="section === 'appearance' ? 'font-semibold text-black' : 'text-gray-400'"
                    class="cursor-pointer flex gap-2">
                    <Palette /> Apariencia
                </p>
                <p @click="section = 'user'" :class="section === 'user' ? 'font-semibold text-black' : 'text-gray-400'"
                    class="cursor-pointer flex gap-2">
                    <User /> Usuario
                </p>
            </div>

            <!-- Contenido -->
            <div class="flex-1 p-6">
                <div v-if="section === 'appearance'" class="flex flex-col gap-5">
                    <!-- selector de tema (ya existente) -->
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
                    
                    <!-- selector de fondo de chat -->
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <p>Fondo del chat:</p>
                            <button v-if="authStore.usuario.bg_type !== 'solid'" @click="elegirSolido"
                                class="text-xs text-gray-500 hover:underline">
                                Restablecer
                            </button>
                        </div>

                        <div class="grid grid-cols-4 gap-2">
                            <!-- una miniatura por cada tema preset -->
                            <div v-for="key in Object.keys(themeStore.themes)" :key="key" class="relative">
                                <img :src="`/backgrounds/${key}.jpg`" @click="elegirPreset(key)"
                                    class="h-14 w-full object-cover rounded cursor-pointer"
                                    :class="esPresetActivo(key) ? 'ring-2 ring-black' : ''" />
                            </div>

                            <!-- miniatura de la imagen personalizada: si aún no hay ninguna, muestra un "+";
             si ya se subió una (bg_type === 'custom'), muestra la propia imagen como preview -->
                            <div class="relative">
                                <div v-if="authStore.usuario.bg_type !== 'custom'" @click="$refs.fileInput.click()"
                                    class="h-14 w-full flex items-center justify-center border-2 border-dashed rounded cursor-pointer text-gray-400 hover:text-gray-600 hover:border-gray-500">
                                    <Plus :size="20" />
                                </div>
                                <img v-else :src="authStore.usuario.bg_value" @click="$refs.fileInput.click()"
                                    class="h-14 w-full object-cover rounded cursor-pointer ring-2 ring-black" />
                            </div>
                        </div>

                        <input ref="fileInput" type="file" accept="image/*" class="hidden"
                            @change="subirPersonalizado" />
                        <p class="text-xs text-gray-400 mt-1">Personalizado: haz clic en el recuadro con "+" para subir
                            tu imagen</p>
                    </div>
                </div>
                <div v-else-if="section === 'user'" class="flex flex-row gap-5">
                    <Construction class="text-orange-600" />
                    <p> En construcción </p>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { X, Palette, User, Construction, Plus } from '@lucide/vue'
import { useThemeStore } from '../stores/themeStore'
import { useUiStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'

const themeStore = useThemeStore()
const uiStore = useUiStore()
const authStore = useAuthStore()

const section = ref('appearance') // apartado activo del modal, por defecto apariencia

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

</script>