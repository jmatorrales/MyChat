CREATE DATABASE IF NOT EXISTS mychat_db;
USE mychat_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar LONGTEXT NULL DEFAULT NULL,
    bg_type ENUM('solid', 'preset', 'custom') NOT NULL DEFAULT 'solid',
    bg_value LONGTEXT NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    type ENUM('individual', 'group') NOT NULL,
    avatar LONGTEXT NULL DEFAULT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS room_users (
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL DEFAULT NULL,
    last_read_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- USUARIO ESTÁNDAR PARA PRUEBAS - user: demo password: demo123 (hasheada)
INSERT INTO users (username, email, password_hash) VALUES ('demo', 'demo@test.com', '$2b$10$/nTSXDxaGRCo9A25dX8LUuqCY9ts2i6znHefjedSXl.xDvvdTIjAC');

SELECT * FROM users;
SELECT * FROM rooms;
SELECT * FROM room_users;
SELECT * FROM messages;
describe rooms;

-- drop database mychat_db;