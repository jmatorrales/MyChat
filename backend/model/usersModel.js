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
  const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);
  return rows[0];
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
};
