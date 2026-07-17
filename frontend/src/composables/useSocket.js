import { io } from 'socket.io-client'
import { ref } from 'vue'

// una única conexión compartida por toda la app (no una nueva por componente)
const socket = io('http://localhost:3156') // ajusta el puerto si tu PORT en .env es distinto

export function useSocket() {
  const mensajes = ref([])

  function unirseSala(roomId) {
    mensajes.value = [] // limpiamos al cambiar de sala
    socket.emit('unirseSala', roomId)
  }

  function enviarMensaje({ roomId, userId, username, content }) {
    socket.emit('mensaje', { roomId, userId, username, content })
  }

  function escucharMensajes(callback) {
    socket.off('mensaje') // evita duplicar listeners al recambiar de componente
    socket.on('mensaje', callback)
  }

  return { socket, mensajes, unirseSala, enviarMensaje, escucharMensajes }
}