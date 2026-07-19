require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Rooms = require("./model/roomsModel");
const Messages = require("./model/messagesModel");

const app = require("./app");
const server = http.createServer(app);
const { setIO } = require("./socket");

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
setIO(io);

// Middleware de socket.io: se ejecuta ANTES de aceptar cualquier conexión.
// Verifica el token que manda el cliente en el "auth" del handshake;
// si es válido, guarda los datos del usuario en el propio socket (socket.user)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("No autenticado"));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload; // { id, username } - disponible en todos los listeners de este socket
    next();
  } catch (err) {
    next(new Error("Token inválido o caducado"));
  }
});

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id, "->", socket.user.username);

  // ya NO hace falta que el cliente "se identifique" mandando su userId;
  // lo sabemos de forma segura porque viene verificado en socket.user
  socket.join(`user_${socket.user.id}`);

  socket.on("unirseSala", (roomId) => {
    socket.join(`sala_${roomId}`);
  });

  socket.on("mensaje", async (data) => {
    try {
      // usamos socket.user.id como autor real del mensaje, IGNORANDO data.userId
      // (si no, cualquiera podría mandar mensajes haciéndose pasar por otro)
      const userId = socket.user.id;
      const username = socket.user.username;

      const room = await Rooms.getById(data.roomId);

      if (room.type === "individual") {
        const miembros = await Rooms.getAllMembers(data.roomId);
        const otro = miembros.find((m) => m.user_id !== userId);
        if (otro && otro.left_at) {
          await Rooms.addUser(data.roomId, otro.user_id);
        }
      }

      const result = await Messages.create({
        room_id: data.roomId,
        user_id: userId,
        content: data.content,
      });

      io.to(`sala_${data.roomId}`).emit("mensaje", {
        id: result.insertId,
        room_id: data.roomId,
        user_id: userId,
        content: data.content,
        username: username,
        avatar: data.avatar, // esto sigue viniendo del cliente porque es solo visual, no sensible
        created_at: new Date(),
      });

      const activos = await Rooms.getUsersInRoom(data.roomId);
      activos
        .filter((u) => u.id !== userId)
        .forEach((u) => io.to(`user_${u.id}`).emit("salas:actualizado"));
    } catch (err) {
      console.error("Error guardando mensaje:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.user.username);
  });
});

const PORT = process.env.PORT || 3080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor en http://0.0.0.0:${PORT}`);
});