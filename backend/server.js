require('dotenv').config(); // carga las variables de entorno ANTES de usar cualquiera (PORT, DB_*, etc.)

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Messages = require('./model/messagesModel'); // para guardar mensajes desde el socket

const app = require('./app'); // la app de Express, ya con todas las rutas REST montadas
const server = http.createServer(app); // servidor HTTP base: Express y Socket.io comparten este mismo servidor/puerto

// Configuramos Socket.io sobre el servidor, permitiendo conexiones desde otro origen (CORS)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] } // en pruebas vale con *, en producción pon la IP/dominio concreto
});

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // el cliente pide unirse a la "room" de socket.io correspondiente a una sala de la BBDD
  // (una room de socket.io es solo una etiqueta interna para agrupar sockets, no crea nada en BBDD)
  socket.on('unirseSala', (roomId) => {
    socket.join(`sala_${roomId}`);
  });

  // recibe un mensaje nuevo del cliente, lo guarda en BBDD, y lo reenvía a todos los conectados a esa sala
  socket.on('mensaje', async (data) => {
    // data esperado: { roomId, userId, username, content }
    try {
      const result = await Messages.create({
        room_id: data.roomId,
        user_id: data.userId,
        content: data.content,
      });

      // reenviamos el mensaje ya "oficial" (con id y fecha reales de la BBDD)
      // io.to(...) envía SOLO a los sockets unidos a esa room, no a todos los conectados al server
      io.to(`sala_${data.roomId}`).emit('mensaje', {
        id: result.insertId,
        room_id: data.roomId,
        user_id: data.userId,
        content: data.content,
        username: data.username, // lo mandamos ya desde el front para no consultar de nuevo a la BBDD
        created_at: new Date(),
      });
    } catch (err) {
      console.error('Error guardando mensaje:', err);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});
// Escucha del la dirección y puerto del servidor
const PORT = process.env.PORT || 3080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en http://0.0.0.0:${PORT}`);
});