<template>
    <div class="flex items-center justify-center bg-gray-300">
        <form @submit.prevent="handleSubmit" class="bg-white shadow-md rounded-xl p-8 w-full max-w-sm space-y-5">
            <h1 class="text-2xl font-bold text-gray-800 text-center">Iniciar sesión</h1>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input v-model="email" type="email" required placeholder="tucorreo@ejemplo.com"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input v-model="password" type="password" required placeholder="••••••••"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div class="flex items-center">
                <input v-model="remember" type="checkbox" id="remember"
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label for="remember" class="ml-2 text-sm text-gray-600">Recordarme</label>
            </div>

            <p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>

            <button type="submit"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
                Entrar
            </button>

            <p class="text-sm text-center text-gray-600">
                ¿No tienes cuenta?
                <router-link to="/register" class="text-blue-600 hover:underline font-medium">
                    Regístrate
                </router-link>
            </p>
        </form>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue' // Funcion data del components
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const email = ref('')
const password = ref('')
const remember = ref(false) // checkbox para recordar al usuario
const error = ref('') // para mostrar el error en el template

const router = useRouter()
const route = useRoute() // TODO: Saber que diferencia hay
const authStore = useAuthStore()

onMounted(() => {
    const guardado = JSON.parse(localStorage.getItem('credenciales'))
    if (guardado) {
        email.value = guardado.email
        password.value = guardado.password
        remember.value = true
    }
})

async function handleSubmit() {
    error.value = ''
    try {
        await authStore.login(email.value, password.value)

        // si marcó "recordarme", guardamos las credenciales; si no, las borramos
        if (remember.value) {
            localStorage.setItem('credenciales', JSON.stringify({ email: email.value, password: password.value }))
        } else {
            localStorage.removeItem('credenciales')
        }

        // si veníamos de un enlace de invitación (u otra ruta protegida), volvemos ahí
        if (route.query.redirect) {
            router.push(route.query.redirect)
        } else if (authStore.usuario.role === 'admin') { // redirige según el rol que devolvió el backend
            router.push('/admin')
        } else {
            router.push('/app')
        }
    } catch (err) {
        error.value = err.message
    }
}
</script>