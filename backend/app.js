//** Montamos la app de Express (rutas REST: users, rooms, messages)
const express = require('express');
const app = express();

//* Permite que el frontend (otro origen/puerto) pueda hacer peticiones a esta API
const cors = require("cors");
app.use(cors());

//* Routers de cada recurso
const usersRouter = require('./routes/users');
const roomsRouter = require('./routes/rooms');
const messagesRouter = require('./routes/messages');
const qrRouter = require('./routes/qr');

//* Middleware: permite leer JSON del body (req.body) en las peticiones
app.use(express.json());

//** Middleware de autorización - PENDIENTE DE USAR (se activará con JWT)
// de momento no está enganchado a ninguna ruta con app.use/router.use
const auth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send("No autorizado");
  }
  next();
};

// Logger: registra cada petición (método, ruta, IP, status) en logs/app.log y logs/error.log
const { loggerMiddleware } = require('./middlewares/logger');
app.use(loggerMiddleware); // se aplica a TODAS las rutas, porque no tiene URL específica

//* Ruta solo para comprobar que el server responde - No se usa, se puede quitar pero en la /api dara 404
app.get('/', (req, res) => res.send('API funcionando'));

//* Delegación de rutas: cada router gestiona su propio recurso
app.use('/users', usersRouter);
app.use('/rooms', roomsRouter);
app.use('/messages', messagesRouter);
app.use('/qr', qrRouter);

// Exportamos la app para que server.js la use como base del servidor HTTP
module.exports = app;