<template>
    <div class="flex flex-col h-[100dvh]">
        <NavComponent />
        <RouterView class="flex-1" />
    </div>
</template>

<script setup>
import NavComponent from '../../components/NavPublic.vue';

</script>

<style></style>
