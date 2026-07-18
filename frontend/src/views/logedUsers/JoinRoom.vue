<template>
  <div class="h-full flex items-center justify-center text-gray-500">
    Uniéndote a la sala...
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomsStore } from '../../stores/roomsStore'

const route = useRoute()
const router = useRouter()
const roomsStore = useRoomsStore()

onMounted(async () => {
  await roomsStore.unirseGrupo(route.params.roomId) // te añade a la sala y refresca la lista
  router.push('/app') // vuelves a la lista de salas, ya con la nueva sala dentro
})
</script>