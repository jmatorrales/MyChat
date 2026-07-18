require("dotenv").config(); // carga las variables de entorno ANTES de usar cualquiera (PORT, DB_*, etc.)

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Rooms = require("./model/roomsModel");
const Messages = require("./model/messagesModel"); // para guardar mensajes desde el socket

const app = require("./app"); // la app de Express, ya con todas las rutas REST montadas
const server = http.createServer(app); // servidor HTTP base: Express y Socket.io comparten este mismo servidor/puerto
const { setIO } = require("./socket");

// Configuramos Socket.io sobre el servidor, permitiendo conexiones desde otro origen (CORS)
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }, // en pruebas vale con *, en producción pon la IP/dominio concreto
});
setIO(io); // guardamos la referencia para poder usarla desde los controllers

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  // el cliente nos dice quién es -> lo metemos en su "canal personal"
  // así podemos avisarle de cosas aunque no esté viendo ninguna sala en concreto
  socket.on("identificarse", (userId) => {
    socket.join(`user_${userId}`);
  });

  // el cliente pide unirse a la "room" de socket.io correspondiente a una sala de la BBDD
  // (una room de socket.io es solo una etiqueta interna para agrupar sockets, no crea nada en BBDD)
  socket.on("unirseSala", (roomId) => {
    socket.join(`sala_${roomId}`);
  });

  // recibe un mensaje nuevo del cliente, lo guarda en BBDD, y lo reenvía a todos los conectados a esa sala
  socket.on("mensaje", async (data) => {
    try {
      const room = await Rooms.getById(data.roomId);

      // si es un chat individual y el otro usuario lo había abandonado, lo revivimos
      // ANTES de crear el mensaje -> así su nueva fecha de entrada queda <= la del mensaje,
      // y el mensaje que lo revive no se filtra al cargar el historial
      if (room.type === "individual") {
        const miembros = await Rooms.getAllMembers(data.roomId);
        const otro = miembros.find((m) => m.user_id !== data.userId);
        if (otro && otro.left_at) {
          await Rooms.addUser(data.roomId, otro.user_id); // upsert: revive
        }
      }

      const result = await Messages.create({
        room_id: data.roomId,
        user_id: data.userId,
        content: data.content,
      });

      io.to(`sala_${data.roomId}`).emit("mensaje", {
        id: result.insertId,
        room_id: data.roomId,
        user_id: data.userId,
        content: data.content,
        username: data.username,
        created_at: new Date(),
      });

      const activos = await Rooms.getUsersInRoom(data.roomId);
      activos
        .filter((u) => u.id !== data.userId)
        .forEach((u) => io.to(`user_${u.id}`).emit("salas:actualizado"));
    } catch (err) {
      console.error("Error guardando mensaje:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado");
  });
});
// Escucha del la dirección y puerto del servidor
const PORT = process.env.PORT || 3080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor en http://0.0.0.0:${PORT}`);
});
