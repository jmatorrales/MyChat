//* Logica para la conexión y consulta de express hacia la BBDD
const db = require("../config/database");
const bcrypt = require("bcryptjs");

module.exports = class Users {
  static async getAll() {
    const [rows] = await db.execute("SELECT * FROM users");
    return rows;
  }
  // Metodo individual  - El correcto
  static async getByEmail(email) {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }

  static async login(email, password) {
    const user = await this.getByEmail(email); // reutilizas el método que ya tienes
    if (!user) return null; // no existe ese email

    const passwordCorrecto = await bcrypt.compare(password, user.password_hash);
    if (!passwordCorrecto) return null; // password incorrecto

    return user; // login OK
  }

  static async getById(id) {
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  }
  //* Para comprobar si el nombre existe o esta en uso
  static async getByUsername(username) {
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    return rows[0];
  }
  // Busca usuarios cuyo username contenga el texto (para el buscador de "nuevo chat")
  static async searchByUsername(query) {
    const [rows] = await db.execute(
      "SELECT id, username, email FROM users WHERE username LIKE ? LIMIT 10",
      [`%${query}%`],
    );
    return rows;
  }

  static async createUser(data) {
    const { username, email, password } = data;
    const passwordHash = await bcrypt.hash(password, 10); // nueva variable + await

    const [result] = await db.execute(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, passwordHash],
    );
    return result;
  }

  // Actualiza la preferencia de fondo de chat de un usuario
  static async updateBackground(userId, { bg_type, bg_value }) {
    const [result] = await db.execute(
      "UPDATE users SET bg_type = ?, bg_value = ? WHERE id = ?",
      [bg_type, bg_value, userId],
    );
    return result;
  }

  // Actualiza el avatar del usuario (base64, igual que el fondo de chat personalizado)
  static async updateAvatar(userId, avatar) {
    const [result] = await db.execute(
      "UPDATE users SET avatar = ? WHERE id = ?",
      [avatar, userId],
    );
    return result;
  }

  // Cambia el email del usuario
  static async updateEmail(userId, newEmail) {
    const [result] = await db.execute(
      "UPDATE users SET email = ? WHERE id = ?",
      [newEmail, userId],
    );
    return result;
  }

  // Cambia la contraseña, verificando primero que la actual sea correcta.
  // Devuelve { ok: false, error } si algo falla, o { ok: true } si se actualizó.
  static async updatePassword(userId, currentPassword, newPassword) {
    const [rows] = await db.execute(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId],
    );
    const user = rows[0];
    if (!user) return { ok: false, error: "Usuario no encontrado" };

    const correcta = await bcrypt.compare(currentPassword, user.password_hash);
    if (!correcta)
      return { ok: false, error: "La contraseña actual no es correcta" };

    const nuevoHash = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [
      nuevoHash,
      userId,
    ]);
    return { ok: true };
  }
};
