<template>
    <div class="flex items-center justify-center bg-gray-300">
        <form @submit.prevent="handleSubmit" class="bg-white shadow-md rounded-xl p-8 w-full max-w-sm space-y-5">
            <h1 class="text-2xl font-bold text-gray-800 text-center">Registro</h1>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
                <input v-model="username" type="text" required placeholder="pepito" @blur="checkUsername"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <p v-if="usernameStatus === 'disponible'" class="text-sm text-green-600 mt-1">✓ Nombre disponible</p>
                <p v-if="usernameStatus === 'ocupado'" class="text-sm text-red-600 mt-1">✗ Ese nombre ya está en uso,
                    prueba otro</p>
                <p v-if="usernameStatus === 'restringido'" class="text-sm text-red-600 mt-1">✗ Ese nombre esta
                    restringido, prueba otro</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input v-model="email" type="email" required placeholder="tucorreo@ejemplo.com"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input v-model="password" type="password" required placeholder="••••••••"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
                <div class="flex flex-row items-center gap-3">
                    <X v-if="password.length < 6" class="text-red-600" :size="18" />
                    <Check v-else class="text-green-600" :size="18" />
                    <p class="text-sm" :class="password.length >= 6 ? 'line-through' : 'no-underline'">Minimo 6
                        caracteres</p>
                </div>
            </div>

            <p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>

            <button type="submit" :disabled="!isValid"
                class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition">
                Registrarse
            </button>

            <p class="text-sm text-center text-gray-600">
                Ya tengo cuenta
                <router-link to="/login" class="text-blue-600 hover:underline font-medium">
                    Entrar
                </router-link>
            </p>
        </form>
    </div>
</template>

<script setup>
import { X, Check } from '@lucide/vue';
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const usernameStatus = ref(null) // null = oculto, 'disponible' | 'ocupado'

// el formulario solo es válido si el username hay un nombre escrito y no está ocupado, hay un email y el password cumple el mínimo
const isValid = computed(() =>
    usernameStatus.value === 'disponible' &&
    email.value.trim().length > 0 &&
    password.value.length >= 6
)

// cada vez que el usuario escribe algo nuevo en el campo, ocultamos el mensaje anterior
// (hasta que vuelva a hacer blur y se compruebe de nuevo)
watch(username, () => {
    usernameStatus.value = null
})

async function checkUsername() {
    // si el campo está vacío, ocultamos cualquier mensaje anterior
    if (!username.value.trim()) {
        usernameStatus.value = null
        return
    }

    // bloqueamos nombres reservados sin necesidad de consultar al backend
    const palabrasProhibidas = ['admin', '@dmin', 'adm1n', '@dm1n']
    // comprueba si alguna de las palabras restringidas esta dentro del username y devuelve true o false
    if (palabrasProhibidas.some(palabra => username.value.trim().toLowerCase().includes(palabra))) {
        return usernameStatus.value = 'restringido'
    }

    // consultamos al backend si el username ya está en uso
    const disponible = await authStore.checkUsername(username.value)
    usernameStatus.value = disponible ? 'disponible' : 'ocupado'
}

async function handleSubmit() {
    error.value = ''
    try {
        await authStore.register(username.value, email.value, password.value)
        router.push('/login')
    } catch (err) {
        error.value = err.message
    }
}
</script>