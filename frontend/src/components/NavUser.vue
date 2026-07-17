<template>
    <div :class="themeStore.current.nav" class="flex flex-row justify-between items-center p-5 gap-3">
        <p class="text-xl font-semibold" :class="themeStore.current.nav_home">MyChat</p>
        <div class="flex flex-row items-center gap-5">
            <Settings @click="uiStore.toggleSettings()" class="cursor-pointer" :size="iconSize" />
            <LogOut @click="handleLogout" class="cursor-pointer" :size="iconSize" />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Settings, LogOut } from '@lucide/vue'
import { useThemeStore } from '../stores/themeStore'
import { useUiStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'

const iconSize = ref("28")
const router = useRouter()

const themeStore = useThemeStore()
const uiStore = useUiStore()
const authStore = useAuthStore()

// cierra sesión y limpia salas (ver authStore.logout), luego saca al usuario al login
function handleLogout() {
    authStore.logout()
    router.push('/login')
}
</script>