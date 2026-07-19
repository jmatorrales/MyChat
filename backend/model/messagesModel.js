const db = require("../config/database");

module.exports = class Messages {
  // guarda un mensaje nuevo en la BBDD
  static async create({ room_id, user_id, content }) {
    const [result] = await db.execute(
      "INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)",
      [room_id, user_id, content],
    );
    return result;
  }

  // Historial de una sala, pero solo desde que ESE usuario entró/reentró
  // (si abandonó y le volvieron a escribir, joined_at se reseteó y no verá lo anterior)
  static async getByRoom(roomId, userId) {
    const [rows] = await db.execute(
      `SELECT m.id, m.room_id, m.user_id, m.content, m.created_at, u.username, u.avatar
        FROM messages m
        JOIN users u ON u.id = m.user_id
        JOIN room_users ru ON ru.room_id = m.room_id AND ru.user_id = ?
        WHERE m.room_id = ? AND m.created_at >= ru.joined_at
        ORDER BY m.created_at ASC`,
      [userId, roomId],
    );
    return rows;
  }
};
