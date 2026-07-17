const Messages = require("../model/messagesModel");
const { logger } = require("../middlewares/logger");

// Devuelve el historial de mensajes de una sala, ordenado del más antiguo al más nuevo
exports.getByRoom = async (req, res) => {
  try {
    const mensajes = await Messages.getByRoom(req.params.roomId);
    res.send(mensajes);
  } catch (err) {
    logger.error({ evento: "error_listar_mensajes", mensaje: err.message });
    res.status(500).json({ error: "Error al listar mensajes" });
  }
};
