import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoomsStore } from "./roomsStore";
import { API_URL } from "../config";
import { socket } from "../composables/useSocket";
import { apiFetch } from "../config";

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
    if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

    usuario.value = data;
    localStorage.setItem("usuario", JSON.stringify(data));

    socket.auth.token = data.token;
    socket.disconnect();
    socket.connect();
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

    return data;
  }

  async function checkUsername(username) {
    const res = await fetch(`${API_URL}/users/username/${username}`);
    const data = await res.json();
    return data.disponible;
  }

  // Trae la lista de imágenes disponibles como fondo (carpeta backend/public/backgrounds).
  // Función independiente, no anidada, para poder llamarla desde cualquier componente
  async function fetchBackgrounds() {
    const res = await apiFetch("/backgrounds-list");
    return await res.json(); // array de nombres de archivo, ej: ["playa.jpg", "montana.jpg"]
  }

  // Actualiza el fondo de chat del usuario logueado, tanto en backend como en el store local
  async function updateBackground(bg_type, bg_value) {
    await apiFetch("/users/background", {
      method: "POST",
      body: JSON.stringify({ userId: usuario.value.id, bg_type, bg_value }),
    });

    // reflejamos el cambio de inmediato en memoria, sin esperar a un refresco de página
    usuario.value.bg_type = bg_type;
    usuario.value.bg_value = bg_value;
    localStorage.setItem("usuario", JSON.stringify(usuario.value));
  }

  // Sube/actualiza el avatar del usuario logueado
  async function updateAvatar(avatar) {
    await apiFetch("/users/avatar", {
      method: "POST",
      body: JSON.stringify({ userId: usuario.value.id, avatar }),
    });
    usuario.value.avatar = avatar;
    localStorage.setItem("usuario", JSON.stringify(usuario.value));
  }

  // Cambia el email del usuario logueado
  async function updateEmail(email) {
    const res = await apiFetch("/users/email", {
      method: "POST",
      body: JSON.stringify({ userId: usuario.value.id, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al actualizar el email");

    usuario.value.email = email;
    localStorage.setItem("usuario", JSON.stringify(usuario.value));
  }

  // Cambia la contraseña, requiere la actual para verificarla en el backend
  async function updatePassword(currentPassword, newPassword) {
    const res = await apiFetch("/users/password", {
      method: "POST",
      body: JSON.stringify({
        userId: usuario.value.id,
        currentPassword,
        newPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || "Error al actualizar la contraseña");
  }

  function logout() {
    usuario.value = null;
    localStorage.removeItem("usuario");
    const roomsStore = useRoomsStore();
    roomsStore.salas = [];
    roomsStore.salaActiva = null;

    socket.disconnect();
  }

  return {
    usuario,
    login,
    register,
    checkUsername,
    fetchBackgrounds,
    updateBackground,
    updateAvatar,
    updateEmail,
    updatePassword,
    logout,
  };
});
