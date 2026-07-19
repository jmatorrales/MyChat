import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "./authStore";
import { API_URL } from "../config";
import { apiFetch } from "../config"; // en vez de solo API_URL

export const useRoomsStore = defineStore("rooms", () => {
  const salas = ref([]); // lista de salas del usuario logueado
  const salaActiva = ref(null); // sala que se está viendo en el ChatWindow

  // trae las salas del usuario logueado
  async function fetchSalas() {
    const authStore = useAuthStore();
    // solo la ruta relativa, apiFetch pone el resto
    const res = await apiFetch(`/rooms/user/${authStore.usuario.id}`);
    salas.value = await res.json();
  }

  // busca usuarios por nombre (para iniciar un chat nuevo)
  async function buscarUsuarios(query) {
    if (!query.trim()) return [];
    const res = await apiFetch(`${API_URL}/users/search/${query}`);
    return await res.json();
  }

  // crea un chat individual con otro usuario y refresca la lista
  // (el backend ya comprueba si el chat existe, así que aquí no duplicamos)
  async function crearIndividual(otroUserId) {
    const authStore = useAuthStore();
    const res = await apiFetch(`${API_URL}/rooms/individual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userA: authStore.usuario.id, userB: otroUserId }),
    });
    const data = await res.json();
    await fetchSalas(); // refresca la lista para que aparezca el nuevo chat
    return data.id;
  }

  // crea una sala de grupo y refresca la lista
  async function crearGrupo(nombre) {
    const authStore = useAuthStore();
    const res = await apiFetch(`${API_URL}/rooms/group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nombre, created_by: authStore.usuario.id }),
    });
    const data = await res.json();
    await fetchSalas();
    return data.id;
  }

  async function markAsRead(roomId) {
    const authStore = useAuthStore();
    await apiFetch(`${API_URL}/rooms/mark-read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, userId: authStore.usuario.id }),
    });
  }

  // busca salas de GRUPO existentes por nombre (para unirse en vez de crear una duplicada)
  async function buscarSalas(query) {
    if (!query.trim()) return [];
    const res = await apiFetch(`${API_URL}/rooms/search/${query}`);
    return await res.json();
  }

  // une al usuario logueado a una sala de grupo ya existente y refresca la lista
  async function unirseGrupo(roomId) {
    const authStore = useAuthStore();
    await apiFetch(`${API_URL}/rooms/add-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, userId: authStore.usuario.id }),
    });
    await fetchSalas();
    return roomId;
  }

  // marca la sala como activa y, si tenía mensajes sin leer, la marca como leída
  function seleccionarSala(sala) {
    salaActiva.value = sala;
    if (sala.hasUnread) {
      sala.hasUnread = false; // feedback inmediato en la UI, sin esperar al backend
      markAsRead(sala.id);
    }
  }

  // trae la info de una sala (nombre, creador) + sus miembros
  async function fetchRoomInfo(roomId) {
    const res = await apiFetch(`${API_URL}/rooms/${roomId}/info`);
    return await res.json();
  }

  async function updateRoomAvatar(roomId, avatar) {
    await apiFetch(`${API_URL}/rooms/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, avatar }),
    });
    await fetchSalas();
  }

  // añade a OTRO usuario concreto a una sala de grupo (usado desde el panel de gestión, por el creador)
  async function anadirAOtroUsuario(roomId, userId) {
    await apiFetch(`${API_URL}/rooms/add-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, userId }),
    });
    await fetchSalas();
  }

  // expulsa a un usuario (o te quitas tú mismo si userId === tu propio id)
  async function removeUser(roomId, userId) {
    const authStore = useAuthStore();
    await apiFetch(`${API_URL}/rooms/remove-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        userId,
        requestedBy: authStore.usuario.id,
      }),
    });
  }

  // abandonar sala: te quitas a ti mismo y refrescas la lista + deseleccionas la sala
  async function abandonarSala(roomId) {
    const authStore = useAuthStore();
    await removeUser(roomId, authStore.usuario.id);
    await fetchSalas();
    if (salaActiva.value?.id === roomId) salaActiva.value = null;
  }

  // pide al backend el QR de una URL cualquiera (usado para el enlace de invitación)
  async function getQR(url) {
    const res = await apiFetch(`${API_URL}/qr?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    return data.qr;
  }

  return {
    salas,
    salaActiva,
    fetchSalas,
    buscarUsuarios,
    crearIndividual,
    crearGrupo,
    markAsRead,
    buscarSalas,
    unirseGrupo,
    seleccionarSala,
    fetchRoomInfo,
    updateRoomAvatar,
    anadirAOtroUsuario,
    removeUser,
    abandonarSala,
    getQR,
  };
});
