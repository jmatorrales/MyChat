import { io } from 'socket.io-client'
import { ref } from 'vue'
import { API_URL } from '../config'

// una única conexión compartida por toda la app (no una nueva por componente)
const socket = io(API_URL)// ajusta el puerto si tu PORT en .env es distinto

let ultimoUserId = null // recordamos quién eres para poder re-identificarnos tras una reconexión

// cada vez que el socket se (re)conecta -> si ya sabíamos quién eras, avisamos otra vez al servidor
socket.on('connect', () => {
  if (ultimoUserId) socket.emit('identificarse', ultimoUserId)
})


export function useSocket() {
  const mensajes = ref([])

  function identificarse(userId) {
    ultimoUserId = userId
    socket.emit('identificarse', userId)
  }

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

  function escucharActualizacionSalas(callback) {
    socket.off('salas:actualizado')
    socket.on('salas:actualizado', callback)
  }

  return { socket, mensajes, identificarse, unirseSala, enviarMensaje, escucharMensajes, escucharActualizacionSalas }
}
