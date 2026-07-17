<template>
  <div class="min-h-[calc(100vh-72px)] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white text-center px-6">
    <h1 class="text-5xl font-extrabold text-gray-800 mb-4">
      MyChat
    </h1>
    <p class="text-lg text-gray-600 max-w-md mb-8">
      Conecta con otras personas de forma anónima, fácil y divertida.
      Chats individuales o salas de grupo, tú decides.
    </p>
    <div class="flex gap-4">
      <router-link to="/register"
        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition">
        Crear cuenta
      </router-link>
      <router-link to="/login"
        class="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-lg transition">
        Iniciar sesión
      </router-link>
    </div>
  </div>
</template>

<script setup>
// portada pública, sin lógica: solo mensaje de bienvenida + acceso a login/registro
</script>