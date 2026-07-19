const Users = require("../model/usersModel");
const { logger } = require("../middlewares/logger");
const jwt = require("jsonwebtoken");

// Lista todos los usuarios (sin usar aún desde ninguna ruta activa)
exports.getAll = async (req, res) => {
  const users = await Users.getAll();
  res.send(users);
};

// Busca un usuario por email exacto (lo usa internamente el login)
exports.getByEmail = async (req, res) => {
  try {
    const user = await Users.getByEmail(req.params.email);

    if (!user) {
      logger.warn({
        evento: "usuario_no_encontrado",
        email: req.params.email,
        ip: req.ip,
      });
      return res.status(404).send({ error: "Usuario no encontrado" });
    }
    delete user.password_hash; // nunca exponemos el hash al frontend
    res.send(user);
  } catch (err) {
    logger.error({
      evento: "error_buscar_usuario",
      mensaje: err.message,
      ip: req.ip,
    });
    res.status(500).json({ error: "Error al buscar el Usuario" });
  }
};

// Busca un usuario por id (uso interno: perfil, salas, mensajes)
exports.getById = async (req, res) => {
  try {
    const user = await Users.getById(req.params.id);
    if (!user) {
      logger.warn({
        evento: "usuario_no_encontrado",
        id: req.params.id,
        ip: req.ip,
      });
      return res.status(404).send({ error: "Usuario no encontrado" });
    }
    delete user.password_hash;
    res.send(user);
  } catch (err) {
    logger.error({
      evento: "error_buscar_usuario",
      mensaje: err.message,
      ip: req.ip,
    });
    res.status(500).json({ error: "Error al buscar el usuario" });
  }
};

// Comprueba si un username YA está en uso (para el formulario de registro)
exports.getByUsername = async (req, res) => {
  try {
    const user = await Users.getByUsername(req.params.username);
    // aquí NO es un error que no exista -> significa que el nombre está libre
    res.json({ disponible: !user });
  } catch (err) {
    logger.error({ evento: "error_check_username", mensaje: err.message });
    res.status(500).json({ error: "Error al comprobar el username" });
  }
};

// Login: compara email + password (bcrypt) y devuelve el usuario si es correcto generando un token
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Users.login(email, password);

    if (!user) {
      logger.warn({ evento: "login_fallido", email, ip: req.ip });
      return res.status(401).send({ error: "Email o contraseña incorrectos" });
    }

    delete user.password_hash;

    // generamos el token con los datos mínimos necesarios para identificar al usuario;
    // expira en 7 días, pasado ese tiempo habría que volver a hacer login
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.send({ ...user, token }); // el usuario recibe sus datos + el token en la misma respuesta
  } catch (err) {
    logger.error({ evento: "error_login", mensaje: err.message });
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// Crea un usuario nuevo (registro), hasheando el password dentro del modelo
exports.create = async (req, res) => {
  try {
    const result = await Users.createUser(req.body);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    logger.error({ evento: "error_crear_usuario", mensaje: err.message });
    res.status(500).json({ error: "Error al crear el usuario" });
  }
};

// Busca usuarios por coincidencia parcial de username (buscador para iniciar un chat nuevo)
exports.search = async (req, res) => {
  try {
    const users = await Users.searchByUsername(req.params.query);
    res.send(users);
  } catch (err) {
    logger.error({ evento: "error_buscar_usuarios", mensaje: err.message });
    res.status(500).json({ error: "Error al buscar usuarios" });
  }
};

// Actualiza el fondo de chat del usuario logueado
exports.updateBackground = async (req, res) => {
  try {
    const { userId, bg_type, bg_value } = req.body;
    await Users.updateBackground(userId, { bg_type, bg_value });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ evento: "error_actualizar_fondo", mensaje: err.message });
    res.status(500).json({ error: "Error al actualizar el fondo" });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const { userId, avatar } = req.body;
    await Users.updateAvatar(userId, avatar);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ evento: "error_actualizar_avatar", mensaje: err.message });
    res.status(500).json({ error: "Error al actualizar el avatar" });
  }
};

exports.updateEmail = async (req, res) => {
  try {
    const { userId, email } = req.body;
    await Users.updateEmail(userId, email);
    res.json({ ok: true });
  } catch (err) {
    // el email tiene UNIQUE en la BBDD -> si ya está en uso, MySQL lanza ER_DUP_ENTRY
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Ese email ya está en uso" });
    }
    logger.error({ evento: "error_actualizar_email", mensaje: err.message });
    res.status(500).json({ error: "Error al actualizar el email" });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const resultado = await Users.updatePassword(
      userId,
      currentPassword,
      newPassword,
    );

    if (!resultado.ok) {
      return res.status(400).json({ error: resultado.error });
    }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ evento: "error_actualizar_password", mensaje: err.message });
    res.status(500).json({ error: "Error al actualizar la contraseña" });
  }
};
