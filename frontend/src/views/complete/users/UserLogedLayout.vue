<template>
  <div class="flex flex-col h-screen">
    <NavUser />
    <RouterView class="flex-1" />
  </div>
</template>

<script setup>
import NavUser from '../../../components/NavUser.vue';
</script>