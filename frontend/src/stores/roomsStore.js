import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "./authStore";

export const useRoomsStore = defineStore("rooms", () => {
  const salas = ref([]); // lista de salas del usuario logueado
  const salaActiva = ref(null); // sala que se está viendo en el ChatWindow

  // trae las salas del usuario logueado
  async function fetchSalas() {
    const authStore = useAuthStore();
    const res = await fetch(
      `http://localhost:3156/rooms/user/${authStore.usuario.id}`,
    );
    salas.value = await res.json();
  }

  // busca usuarios por nombre (para iniciar un chat nuevo)
  async function buscarUsuarios(query) {
    if (!query.trim()) return [];
    const res = await fetch(`http://localhost:3156/users/search/${query}`);
    return await res.json();
  }

  // crea un chat individual con otro usuario y refresca la lista
  // (el backend ya comprueba si el chat existe, así que aquí no duplicamos)
  async function crearIndividual(otroUserId) {
    const authStore = useAuthStore();
    const res = await fetch("http://localhost:3156/rooms/individual", {
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
    const res = await fetch("http://localhost:3156/rooms/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nombre, created_by: authStore.usuario.id }),
    });
    const data = await res.json();
    await fetchSalas();
    return data.id;
  }

  // busca salas de GRUPO existentes por nombre (para unirse en vez de crear una duplicada)
  async function buscarSalas(query) {
    if (!query.trim()) return [];
    const res = await fetch(`http://localhost:3156/rooms/search/${query}`);
    return await res.json();
  }

  // une al usuario logueado a una sala de grupo ya existente y refresca la lista
  async function unirseGrupo(roomId) {
    const authStore = useAuthStore();
    await fetch("http://localhost:3156/rooms/add-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, userId: authStore.usuario.id }),
    });
    await fetchSalas();
    return roomId;
  }

  // marca una sala como "activa" -> es la que se muestra en el ChatWindow
  function seleccionarSala(sala) {
    salaActiva.value = sala;
  }

  return {
    salas,
    salaActiva,
    fetchSalas,
    buscarUsuarios,
    crearIndividual,
    crearGrupo,
    buscarSalas,
    unirseGrupo,
    seleccionarSala,
  };
});