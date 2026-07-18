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
                <div v-if="section === 'appearance'" class="flex flex-col gap-3">
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
import { X, Palette, User, Construction } from '@lucide/vue'
import { useThemeStore } from '../stores/themeStore'
import { useUiStore } from '../stores/uiStore'

const themeStore = useThemeStore()
const uiStore = useUiStore()

const section = ref('appearance') // apartado activo del modal, por defecto apariencia
</script>