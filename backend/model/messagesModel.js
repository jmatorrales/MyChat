const db = require("../config/database");

module.exports = class Messages {
  // guarda un mensaje nuevo en la BBDD
  static async create({ room_id, user_id, content }) {
    const [result] = await db.execute(
      "INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)",
      [room_id, user_id, content]
    );
    return result;
  }

  // trae el historial de una sala, con el username de quien escribió cada mensaje
  static async getByRoom(roomId) {
    const [rows] = await db.execute(
      `SELECT m.id, m.room_id, m.user_id, m.content, m.created_at, u.username
       FROM messages m
       JOIN users u ON u.id = m.user_id
       WHERE m.room_id = ?
       ORDER BY m.created_at ASC`,
      [roomId]
    );
    return rows;
  }
};