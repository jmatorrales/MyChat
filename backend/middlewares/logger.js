const winston = require('winston');
const path = require('path');

// Configuramos Winston: dónde y cómo se guardan los logs
const logger = winston.createLogger({
  level: 'info', // nivel mínimo que registra (info, warn, error)
  format: winston.format.combine(
    winston.format.timestamp(), // añade fecha/hora a cada log
    winston.format.json() // formato JSON, fácil de leer/filtrar después
  ),
  transports: [
    // guarda TODO en un archivo general
    new winston.transports.File({ filename: path.join(__dirname, '../logs/app.log') }),
    // guarda SOLO errores en un archivo aparte (para detectar averías rápido)
    new winston.transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
    // también lo muestra por consola mientras desarrollas
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Middleware que se engancha a CADA petición
function loggerMiddleware(req, res, next) {
  // req.user vendrá del middleware de autenticación (cuando lo tengas con JWT)
  // de momento, si no hay usuario logueado, ponemos "anónimo"
  const usuario = req.user?.username || 'anonimo';

  // capturamos cuándo termina la respuesta para loguear también el resultado (status code)
  res.on('finish', () => {
    logger.info({
      usuario,
      metodo: req.method,       // GET, POST, etc.
      ruta: req.originalUrl,    // qué endpoint se llamó
      ip: req.ip,               // desde dónde
      status: res.statusCode,   // resultado de la petición (200, 404, 500...)
    });
  });

  next(); // dejamos pasar la petición al siguiente middleware/ruta
}

module.exports = { loggerMiddleware, logger };