import { defineStore } from "pinia";
import { ref } from "vue";
import { useRoomsStore } from "./roomsStore";
import { API_URL } from "../config";

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

  // Actualiza el fondo de chat del usuario logueado, tanto en backend como en el store local
  async function updateBackground(bg_type, bg_value) {
    await fetch(`${API_URL}/users/background`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: usuario.value.id, bg_type, bg_value }),
    });
    // reflejamos el cambio de inmediato en memoria, sin esperar a un refresco de página
    usuario.value.bg_type = bg_type;
    usuario.value.bg_value = bg_value;
    localStorage.setItem("usuario", JSON.stringify(usuario.value));
  }

  // Sube/actualiza el avatar del usuario logueado
  async function updateAvatar(avatar) {
    await fetch(`${API_URL}/users/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: usuario.value.id, avatar }),
    });
    usuario.value.avatar = avatar;
    localStorage.setItem("usuario", JSON.stringify(usuario.value));
  }

  // Cambia el email del usuario logueado
  async function updateEmail(email) {
    const res = await fetch(`${API_URL}/users/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: usuario.value.id, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al actualizar el email");

    usuario.value.email = email;
    localStorage.setItem("usuario", JSON.stringify(usuario.value));
  }

  // Cambia la contraseña, requiere la actual para verificarla en el backend
  async function updatePassword(currentPassword, newPassword) {
    const res = await fetch(`${API_URL}/users/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    // limpiamos también el estado de salas, para que no queden referencias colgando
    const roomsStore = useRoomsStore();
    roomsStore.salas = [];
    roomsStore.salaActiva = null;
  }

  return {
    usuario,
    login,
    register,
    checkUsername,
    updateBackground,
    updateAvatar,
    updateEmail,
    updatePassword,
    logout,
  };
});
