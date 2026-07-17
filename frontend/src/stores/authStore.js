import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoomsStore } from "./roomsStore";
import { API_URL } from '../config'

export const useAuthStore = defineStore("auth", () => {
  //* Recuperamos el usuario guardado del localStorage al cargar la app si ya lo estaba previamente
  const usuario = ref(JSON.parse(localStorage.getItem("usuario")) || null);

  //* Funcion para conectarnos con el backend y logearnos
  async function login(email, password) {
    const res = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      // si el backend responde 401/400/500, lanzamos el mensaje de error para pillarlo en el componente
      throw new Error(data.error || "Error al iniciar sesión");
    }
    usuario.value = data;
    localStorage.setItem("usuario", JSON.stringify(data)); // persistencia
  }

  //* Funcion para registrarse
  async function register(username, email, password) {
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      const mensaje =
        data.errores?.[0]?.msg || data.error || "Error al registrarse";
      throw new Error(mensaje);
    }

    return data; // devuelve { id: ... }
  }

  async function checkUsername(username) {
    const res = await fetch(`${API_URL}/users/username/${username}`);
    const data = await res.json();
    return data.disponible;
  }

  function logout() {
    usuario.value = null;
    localStorage.removeItem("usuario");
    // limpiamos también el estado de salas, para que no queden referencias colgando
    const roomsStore = useRoomsStore();
    roomsStore.salas = [];
    roomsStore.salaActiva = null;
  }

  return { usuario, login, register, checkUsername, logout };
});
