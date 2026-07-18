const Rooms = require("../model/roomsModel");
const { logger } = require("../middlewares/logger");
const { getIO } = require("../socket");

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
// Antes de crear, comprueba si ya existe un chat entre ambos (evita duplicados)
exports.createIndividual = async (req, res) => {
  try {
    const { userA, userB } = req.body;

    // si ya existe un chat individual entre estos dos usuarios, devolvemos ese id sin crear otro
    const existente = await Rooms.findIndividual(userA, userB);
    if (existente) {
      return res.status(200).json({ id: existente.id });
    }

    // no existía -> lo creamos y metemos a los dos usuarios
    const result = await Rooms.createIndividual({ created_by: userA });
    await Rooms.addUser(result.insertId, userA);
    await Rooms.addUser(result.insertId, userB);

    // avisamos al otro usuario en tiempo real, para que le aparezca el chat sin refrescar
    const io = getIO();
    if (io) io.to(`user_${userB}`).emit("salas:actualizado");

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    logger.error({
      evento: "error_crear_sala_individual",
      mensaje: err.message,
    });
    res.status(500).json({ error: "Error al crear el chat individual" });
  }
};

// Busca salas de GRUPO por coincidencia parcial de nombre (para unirse en vez de duplicar)
exports.searchGroups = async (req, res) => {
  try {
    const salas = await Rooms.searchGroups(req.params.query);
    res.send(salas);
  } catch (err) {
    logger.error({ evento: "error_buscar_salas", mensaje: err.message });
    res.status(500).json({ error: "Error al buscar salas" });
  }
};

// Añade un usuario existente a una sala de grupo (invitación / unirse por enlace)
exports.addUser = async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    await Rooms.addUser(roomId, userId);

    // avisamos a todos los de la sala (incluido el nuevo) para que se refresque en tiempo real
    const io = getIO();
    if (io) io.to(`user_${userId}`).emit("salas:actualizado");

    res.status(201).send({ ok: true });
  } catch (err) {
    logger.error({ evento: "error_anadir_usuario_sala", mensaje: err.message });
    res.status(500).json({ error: "Error al añadir usuario a la sala" });
  }
};

// Info de una sala + sus miembros (para el panel de gestión)
exports.getRoomInfo = async (req, res) => {
  try {
    const room = await Rooms.getById(req.params.id);
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });

    const usuarios = await Rooms.getUsersInRoom(req.params.id);
    res.json({ ...room, usuarios });
  } catch (err) {
    logger.error({ evento: "error_info_sala", mensaje: err.message });
    res.status(500).json({ error: "Error al obtener la sala" });
  }
};

// Quita a un usuario de la sala: expulsión (solo el creador puede hacerlo con otros)
// o abandono (cualquiera puede quitarse a sí mismo)
exports.removeUser = async (req, res) => {
  try {
    const { roomId, userId, requestedBy } = req.body;
    const room = await Rooms.getById(roomId);
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });

    const esUnoMismo = requestedBy === userId;
    const esCreador = room.created_by === requestedBy;

    if (!esUnoMismo && !esCreador) {
      return res.status(403).json({ error: "No tienes permiso para expulsar a este usuario" });
    }

    await Rooms.removeUser(roomId, userId); // ahora es soft delete (left_at)

    const activos = await Rooms.getUsersInRoom(roomId); // solo activos

    if (activos.length === 0) {
      await Rooms.deleteRoom(roomId); // nadie activo -> borramos la sala del todo
    } else if (room.created_by === userId) {
      const nuevoAdmin = await Rooms.getOldestMember(roomId);
      if (nuevoAdmin) await Rooms.updateCreatedBy(roomId, nuevoAdmin.user_id);
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ evento: "error_quitar_usuario_sala", mensaje: err.message });
    res.status(500).json({ error: "Error al quitar al usuario de la sala" });
  }
};
