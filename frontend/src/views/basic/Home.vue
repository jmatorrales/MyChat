<template>
    <div class="flex flex-col h-screen">
        <NavComponent />
        <RouterView class="flex-1" />
    </div>
</template>

<script setup>
import NavComponent from '../../components/NavPublic.vue';

</script>

<style></style>
