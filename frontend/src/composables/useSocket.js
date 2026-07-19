import { io } from "socket.io-client";
import { ref } from "vue";
import { API_URL } from "../config";

// obtenemos el token guardado (si existe) para autenticar el socket desde el primer momento
function getToken() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  return usuario?.token;
}

// conexión única compartida por toda la app; el token viaja en el "auth" del handshake,
// que socket.io valida en el middleware io.use() del servidor antes de aceptar la conexión
export const socket = io(API_URL, {
  auth: { token: getToken() },
});

export function useSocket() {
  const mensajes = ref([]);

  function unirseSala(roomId) {
    mensajes.value = [];
    socket.emit("unirseSala", roomId);
  }

  // ya no hace falta mandar userId/username: el backend los conoce de forma segura
  // a partir del token verificado (socket.user), así que solo mandamos lo necesario
  function enviarMensaje({ roomId, avatar, content }) {
    socket.emit("mensaje", { roomId, avatar, content });
  }

  function escucharMensajes(callback) {
    socket.off("mensaje");
    socket.on("mensaje", callback);
  }

  function escucharActualizacionSalas(callback) {
    socket.off("salas:actualizado");
    socket.on("salas:actualizado", callback);
  }

  return {
    socket,
    mensajes,
    unirseSala,
    enviarMensaje,
    escucharMensajes,
    escucharActualizacionSalas,
  };
}
