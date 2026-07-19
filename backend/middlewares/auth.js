const jwt = require("jsonwebtoken");

// Middleware que comprueba el header "Authorization: Bearer <token>".
// Si es válido, rellena req.user con los datos guardados en el token (id, username)
// y deja pasar la petición. Si no hay token o no es válido, corta con 401.
function auth(req, res, next) {
  const header = req.headers.authorization; // formato esperado: "Bearer eyJhbGci..."
  if (!header) {
    return res.status(401).json({ error: "No autenticado" });
  }

  const token = header.split(" ")[1]; // quitamos la palabra "Bearer"
  if (!token) {
    return res.status(401).json({ error: "Token mal formado" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // lanza error si es inválido/caducado
    req.user = payload; // { id, username } - disponible en el resto de la cadena (controller, logger...)
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o caducado" });
  }
}

module.exports = auth;
