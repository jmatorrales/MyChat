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
                    <button @click="themeStore.setTheme('yelow')"
                        class="w-[150px] border border-yellow-200 bg-yellow-300 hover:border-yellow-600 hover:bg-yellow-500">Amarillo</button>
                    <button @click="themeStore.setTheme('red')"
                        class="w-[150px] border border-red-200 bg-red-300 hover:border-red-600 hover:bg-red-500">Rojo</button>
                    <button @click="themeStore.setTheme('blue')"
                        class="w-[150px] border border-blue-200 bg-blue-300 hover:border-blue-600 hover:bg-blue-500">Azul</button>
                    <button @click="themeStore.setTheme('purple')"
                        class="w-[150px] border border-purple-300 bg-purple-400 hover:border-purple-600 hover:bg-purple-500">Purpura</button>
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