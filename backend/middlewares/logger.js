const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

// Transporte para el log general: un archivo nuevo cada día, con nombre tipo "2026-07-19-app.log"
const transporteDiario = new DailyRotateFile({
  filename: path.join(__dirname, "../logs/%DATE%-app.log"), // %DATE% se sustituye por la fecha real
  datePattern: "YYYY-MM-DD", // formato de fecha en el nombre del archivo
  maxFiles: "30d", // borra automáticamente logs de hace más de 30 días (evita que crezca sin control)
});

// Igual que el anterior, pero solo para errores (útil para detectar averías rápido, sin ruido de logs normales)
const transporteErroresDiario = new DailyRotateFile({
  filename: path.join(__dirname, "../logs/%DATE%-error.log"),
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxFiles: "30d",
});

// Configuramos Winston: dónde y cómo se guardan los logs
const logger = winston.createLogger({
  level: "info", // nivel mínimo que registra (info, warn, error)
  format: winston.format.combine(
    winston.format.timestamp(), // añade fecha/hora a cada log
    winston.format.json(), // formato JSON, fácil de leer/filtrar después
  ),
  transports: [
    transporteDiario, // guarda TODO en el archivo del día
    transporteErroresDiario, // guarda SOLO errores en su propio archivo del día
    new winston.transports.Console({ format: winston.format.simple() }), // también lo muestra por consola mientras desarrollas
  ],
});

// Middleware que se engancha a CADA petición
function loggerMiddleware(req, res, next) {
  // req.user vendrá del middleware de autenticación (cuando lo tengas con JWT)
  // de momento, si no hay usuario logueado, ponemos "anónimo"
  const usuario = req.user?.username || "anonimo";

  // capturamos cuándo termina la respuesta para loguear también el resultado (status code)
  res.on("finish", () => {
    logger.info({
      usuario,
      metodo: req.method, // GET, POST, etc.
      ruta: req.originalUrl, // qué endpoint se llamó
      ip: req.ip, // desde dónde
      status: res.statusCode, // resultado de la petición (200, 404, 500...)
    });
  });

  next(); // dejamos pasar la petición al siguiente middleware/ruta
}

module.exports = { loggerMiddleware, logger };
