const Users = require("../model/usersModel");
const { logger } = require("../middlewares/logger");

exports.getAll = async (req, res) => {
  const users = await Users.getAll();
  res.send(users);
};

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
    delete user.password_hash; // quitamos el hash antes de responder
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
    delete user.password_hash; // quitamos el hash antes de responder
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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Users.login(email, password);

    if (!user) {
      logger.warn({ evento: "login_fallido", email, ip: req.ip });
      return res.status(401).send({ error: "Email o contraseña incorrectos" });
    }

    delete user.password_hash; // quitamos el hash antes de responder
    res.send(user); // de momento sin token, luego añadiremos JWT aquí
  } catch (err) {
    logger.error({ evento: "error_login", mensaje: err.message });
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

exports.create = async (req, res) => {
  try {
    const result = await Users.createUser(req.body);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    logger.error({ evento: "error_crear_usuario", mensaje: err.message });
    res.status(500).json({ error: "Error al crear el usuario" });
  }
};
