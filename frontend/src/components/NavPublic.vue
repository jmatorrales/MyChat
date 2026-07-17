<template>
    <div class="flex flex-row items-center justify-between p-3">
        <div>
            <p class="text-2xl">MyChat</p>
        </div>
        <div class="p-3 flex flex-row gap-5">
            <!-- nav de la zona PÚBLICA: solo Home y acceso al login -->
            <button @click="router.push('/')">Home</button>
            <button @click="router.push({ path: '/login' })">Acceder</button>
        </div>
    </div>
</template>
<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>
<style></style>