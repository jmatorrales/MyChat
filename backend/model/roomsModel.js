//* Lógica para la conexión y consulta de rooms hacia la BBDD
const db = require("../config/database");

module.exports = class Rooms {
  // Devuelve las salas donde participa un usuario, resolviendo el nombre a mostrar según el tipo:
  // - si es grupo -> el nombre real de la sala
  // - si es individual -> el username del OTRO participante (no el mío)
  static async getByUserId(userId) {
    const [rows] = await db.execute(
      `SELECT 
       r.id, 
       r.type, 
       r.created_by,
       CASE 
         WHEN r.type = 'group' THEN r.name
         ELSE otro.username
       END AS displayName
     FROM rooms r
     JOIN room_users ru ON ru.room_id = r.id AND ru.user_id = ?
     -- el join con "el otro usuario" ahora SOLO se hace para chats individuales
     LEFT JOIN room_users ru_otro ON ru_otro.room_id = r.id AND ru_otro.user_id != ? AND r.type = 'individual'
     LEFT JOIN users otro ON otro.id = ru_otro.user_id
     WHERE ru.room_id IN (
       SELECT room_id FROM room_users WHERE user_id = ?
     )
     -- un chat individual solo aparece si YO lo creé, o si ya hay al menos un mensaje
     -- (así B no ve el chat hasta que A le escriba de verdad)
     AND (
       r.type = 'group'
       OR r.created_by = ?
       OR EXISTS (SELECT 1 FROM messages m WHERE m.room_id = r.id)
     )`,
      [userId, userId, userId, userId],
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

  // Añade un usuario a una sala (tabla intermedia room_users)
  static async addUser(roomId, userId) {
    const [result] = await db.execute(
      "INSERT INTO room_users (room_id, user_id) VALUES (?, ?)",
      [roomId, userId],
    );
    return result;
  }

  // Lista los usuarios que pertenecen a una sala
  static async getUsersInRoom(roomId) {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.email
       FROM users u
       JOIN room_users ru ON ru.user_id = u.id
       WHERE ru.room_id = ?`,
      [roomId],
    );
    return rows;
  }

  // comprueba si ya existe un chat individual entre dos usuarios concretos
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

  // busca salas de GRUPO por nombre (para unirse a una ya existente)
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

  // miembro más antiguo de la sala (para reasignar el admin cuando el creador se va)
  static async getOldestMember(roomId) {
    const [rows] = await db.execute(
      "SELECT user_id FROM room_users WHERE room_id = ? ORDER BY joined_at ASC LIMIT 1",
      [roomId],
    );
    return rows[0];
  }

  // cambia quién es el creador/admin de la sala
  static async updateCreatedBy(roomId, newCreatorId) {
    const [result] = await db.execute(
      "UPDATE rooms SET created_by = ? WHERE id = ?",
      [newCreatorId, roomId],
    );
    return result;
  }

  // Elimina a un usuario de una sala (sirve tanto para "expulsar" como para "abandonar")
  static async removeUser(roomId, userId) {
    const [result] = await db.execute(
      "DELETE FROM room_users WHERE room_id = ? AND user_id = ?",
      [roomId, userId],
    );
    return result;
  }

  // Elimina la sala si ya no hay usuarios (el ultimo usuario de la sala se va que seria el admin)
  static async deleteRoom(roomId) {
    const [result] = await db.execute("DELETE FROM rooms WHERE id = ?", [
      roomId,
    ]);
    return result;
  }
};
