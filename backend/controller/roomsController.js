const Rooms = require("../model/roomsModel");
const { logger } = require("../middlewares/logger");

// Devuelve todas las salas/chats de un usuario, con el nombre ya resuelto
exports.getMisSalas = async (req, res) => {
  try {
    const salas = await Rooms.getByUserId(req.params.userId);
    res.send(salas);
  } catch (err) {
    logger.error({ evento: "error_listar_salas", mensaje: err.message });
    res.status(500).json({ error: "Error al listar salas" });
  }
};

// Crea una sala de GRUPO: solo el creador entra al principio,
// los demás se añaden después con addUser (el creador los invita)
exports.createGroup = async (req, res) => {
  try {
    const { name, created_by } = req.body;
    const result = await Rooms.createGroup({ name, created_by });

    // el creador entra automáticamente a su propia sala
    await Rooms.addUser(result.insertId, created_by);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    logger.error({ evento: "error_crear_sala_grupo", mensaje: err.message });
    res.status(500).json({ error: "Error al crear la sala de grupo" });
  }
};

// Crea una sala INDIVIDUAL: se necesitan los DOS usuarios de una vez
// (a diferencia del grupo, aquí no tiene sentido crear la sala sin el otro participante)
exports.createIndividual = async (req, res) => {
  try {
    const { userA, userB } = req.body;
    const result = await Rooms.createIndividual({ created_by: userA });

    // metemos a los dos participantes de golpe
    await Rooms.addUser(result.insertId, userA);
    await Rooms.addUser(result.insertId, userB);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    logger.error({ evento: "error_crear_sala_individual", mensaje: err.message });
    res.status(500).json({ error: "Error al crear el chat individual" });
  }
};

exports.searchGroups = async (req, res) => {
  try {
    const salas = await Rooms.searchGroups(req.params.query);
    res.send(salas);
  } catch (err) {
    logger.error({ evento: "error_buscar_salas", mensaje: err.message });
    res.status(500).json({ error: "Error al buscar salas" });
  }
};

// Añade un usuario existente a una sala de grupo (invitación)
exports.addUser = async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    await Rooms.addUser(roomId, userId);
    res.status(201).send({ ok: true });
  } catch (err) {
    logger.error({ evento: "error_anadir_usuario_sala", mensaje: err.message });
    res.status(500).json({ error: "Error al añadir usuario a la sala" });
  }
};