//** Montamos la app
const express = require('express')
const app = express();

//* npm install cors -> para que el server reciba peticiones de otro origen
const cors = require("cors");
app.use(cors());

//* Rutas de las diferentes peticiones
const usersRouter = require('./routes/users');

//* Middleware: permite leer JSON del body (req.body) en las peticiones
app.use(express.json());

//** Codigo para probar autorización - de momento no usar
const auth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send("No autorizado");
  }
  next();
};

const { loggerMiddleware } = require('./middlewares/logger');
app.use(loggerMiddleware);// se aplica a TODAS las rutas, porque no tiene URL específica

//* Delegación de rutas (URL, variable de la ruta) // (URL, Middleware, router final )
// en app.js
app.get('/', (req, res) => res.send('API funcionando 🚀'));
app.use('/users', usersRouter);

// Exportamos la app para poder arrancarla desde otro archivo (ej: server.js)
module.exports = app;
