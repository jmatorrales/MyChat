//* Lógica para la conexión y consulta de rooms hacia la BBDD
const db = require("../config/database");

module.exports = class Rooms {
  // Devuelve las salas ACTIVAS de un usuario, con el nombre resuelto y si tiene mensajes sin leer,
  // resolviendo el nombre a mostrar según el tipo:
  // - si es grupo -> el nombre real de la sala
  // - si es individual -> el username del OTRO participante (no el mío)
  // Un chat individual solo se muestra si YO lo creé, o si ya hay al menos un mensaje
  // (así el destinatario no ve el chat hasta que le escriban de verdad)
  static async getByUserId(userId) {
    const [rows] = await db.execute(
      `SELECT 
       r.id, 
       r.type, 
       r.created_by,
       CASE 
         WHEN r.type = 'group' THEN r.name
         WHEN otro.username IS NULL THEN CONCAT(yo.username, ' (Tú)')
         ELSE otro.username
       END AS displayName,
       EXISTS (
         SELECT 1 FROM messages m
         WHERE m.room_id = r.id
           AND m.user_id != ?
           AND m.created_at > COALESCE(ru.last_read_at, ru.joined_at)
       ) AS hasUnread
        FROM rooms r
        JOIN room_users ru ON ru.room_id = r.id AND ru.user_id = ? AND ru.left_at IS NULL
        LEFT JOIN room_users ru_otro ON ru_otro.room_id = r.id AND ru_otro.user_id != ? AND r.type = 'individual'
        LEFT JOIN users otro ON otro.id = ru_otro.user_id
        LEFT JOIN users yo ON yo.id = ?
        WHERE r.type = 'group'
            OR r.created_by = ?
            OR EXISTS (SELECT 1 FROM messages m WHERE m.room_id = r.id)`,
      [userId, userId, userId, userId, userId],
    );
    return rows;
  }

  // Lista los usuarios ACTIVOS de una sala (para el panel de gestión y el cálculo de nuevo admin)
  // Un usuario deja de estar "activo" cuando abandona el chat (left_at deja de ser NULL)
  static async getUsersInRoom(roomId) {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.email
       FROM users u
       JOIN room_users ru ON ru.user_id = u.id
       WHERE ru.room_id = ? AND ru.left_at IS NULL`,
      [roomId],
    );
    return rows;
  }

  // Todos los miembros históricos de una sala, activos o no (para saber quién la abandonó)
  static async getAllMembers(roomId) {
    const [rows] = await db.execute(
      "SELECT user_id, left_at FROM room_users WHERE room_id = ?",
      [roomId],
    );
    return rows;
  }

  // Crea una sala de GRUPO (con nombre obligatorio)
  static async createGroup({ name, created_by }) {
    const [result] = await db.execute(
      "INSERT INTO rooms (name, type, created_by) VALUES (?, 'group', ?)",
      [name, created_by],
    );
    return result;
  }

  // Crea una sala INDIVIDUAL (sin nombre, se calcula luego según quién mire)
  static async createIndividual({ created_by }) {
    const [result] = await db.execute(
      "INSERT INTO rooms (name, type, created_by) VALUES (NULL, 'individual', ?)",
      [created_by],
    );
    return result;
  }

  // Añade un usuario a una sala (tabla intermedia room_users). Si YA existía una fila (porque la había abandonado antes),
  // la revive en vez de fallar por clave duplicada (room_id + user_id es la PK)
  static async addUser(roomId, userId) {
    const [result] = await db.execute(
      `INSERT INTO room_users (room_id, user_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE left_at = NULL, joined_at = NOW()`,
      [roomId, userId],
    );
    return result;
  }

  // Busca un chat "contigo mismo": una sala individual donde el ÚNICO usuario que
  // ha pertenecido alguna vez (activo o no) es este mismo userId. Se usa en vez de
  // findIndividual cuando userA === userB, porque findIndividual no distingue eso.
  static async findSelfChat(userId) {
    const [rows] = await db.execute(
      `SELECT r.id FROM rooms r
     JOIN room_users ru ON ru.room_id = r.id
     WHERE r.type = 'individual' AND r.created_by = ?
     GROUP BY r.id
     HAVING COUNT(DISTINCT ru.user_id) = 1 AND MAX(ru.user_id) = ?
     LIMIT 1`,
      [userId, userId],
    );
    return rows[0];
  }

  // Comprueba si ya existe un chat individual entre dos usuarios concretos
  static async findIndividual(userA, userB) {
    const [rows] = await db.execute(
      `SELECT r.id FROM rooms r
       JOIN room_users ru1 ON ru1.room_id = r.id AND ru1.user_id = ?
       JOIN room_users ru2 ON ru2.room_id = r.id AND ru2.user_id = ?
       WHERE r.type = 'individual'
       LIMIT 1`,
      [userA, userB],
    );
    return rows[0];
  }

  // Busca salas de GRUPO por nombre (para unirse a una ya existente en vez de duplicar)
  static async searchGroups(query) {
    const [rows] = await db.execute(
      `SELECT id, name FROM rooms WHERE type = 'group' AND name LIKE ? LIMIT 10`,
      [`%${query}%`],
    );
    return rows;
  }

  // Info básica de una sala (nombre, tipo, creador)
  static async getById(roomId) {
    const [rows] = await db.execute("SELECT * FROM rooms WHERE id = ?", [
      roomId,
    ]);
    return rows[0];
  }

  // Miembro ACTIVO más antiguo de la sala (para reasignar el admin cuando el creador se va)
  static async getOldestMember(roomId) {
    const [rows] = await db.execute(
      "SELECT user_id FROM room_users WHERE room_id = ? AND left_at IS NULL ORDER BY joined_at ASC LIMIT 1",
      [roomId],
    );
    return rows[0];
  }

  // Cambia quién es el creador/admin de la sala
  static async updateCreatedBy(roomId, newCreatorId) {
    const [result] = await db.execute(
      "UPDATE rooms SET created_by = ? WHERE id = ?",
      [newCreatorId, roomId],
    );
    return result;
  }

  // Marca a un usuario como que ha abandonado la sala (soft delete, no borra la fila)
  static async removeUser(roomId, userId) {
    const [result] = await db.execute(
      "UPDATE room_users SET left_at = NOW() WHERE room_id = ? AND user_id = ?",
      [roomId, userId],
    );
    return result;
  }

  // Marca una sala como leída por un usuario (se llama al abrir el chat)
  static async markAsRead(roomId, userId) {
    const [result] = await db.execute(
      "UPDATE room_users SET last_read_at = NOW() WHERE room_id = ? AND user_id = ?",
      [roomId, userId],
    );
    return result;
  }

  // Elimina la sala por completo cuando ya no queda nadie activo dentro
  // (ON DELETE CASCADE en la BBDD se encarga de borrar room_users y messages asociados)
  static async deleteRoom(roomId) {
    const [result] = await db.execute("DELETE FROM rooms WHERE id = ?", [
      roomId,
    ]);
    return result;
  }
};
