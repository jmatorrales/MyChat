<template>
  <div class="flex flex-col h-screen">
    <NavUser />
    <RouterView class="flex-1" /> <!-- aquí se renderiza Salas.vue -->
    <SettingsUsers /> <!-- modal de ajustes, se muestra/oculta con uiStore.showSettings -->
  </div>
</template>

<script setup>
import NavUser from '../../../components/NavUser.vue'
import SettingsUsers from '../../../components/SettingsUsers.vue'
</script>