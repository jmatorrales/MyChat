# MyChat

Aplicación de chat en tiempo real desarrollada como proyecto de práctica. Permite registro/login de usuarios, chats individuales y salas de grupo, mensajería en tiempo real con Socket.io, invitaciones por enlace/QR, personalización de apariencia (temas, fondos de chat, avatares) y gestión de perfil de usuario.

## Índice

- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos](#base-de-datos)
- [Puesta en marcha](#puesta-en-marcha)
- [Notas y cosas a tener en cuenta](#notas-y-cosas-a-tener-en-cuenta)

---

## Stack tecnológico

**Backend**
- Node.js + Express — API REST
- Socket.io — comunicación en tiempo real (mensajes, notificaciones de sala)
- MySQL (mysql2) — base de datos
- JWT (jsonwebtoken) — autenticación
- bcryptjs — hash de contraseñas
- Winston + winston-daily-rotate-file — logging por día
- express-validator — validación de datos de entrada
- qrcode — generación de códigos QR para invitaciones

**Frontend**
- Vue 3 (`<script setup>`, Composition API)
- Vite — bundler/dev server
- Vue Router 4 — enrutado con guards de autenticación
- Pinia — gestión de estado (auth, salas, tema, UI)
- Tailwind CSS — estilos
- Socket.io-client — conexión en tiempo real
- @lucide/vue — iconos

**Herramientas de desarrollo**
- Nodemon — reinicio automático del backend
- Concurrently — arranca backend y frontend con un solo comando

---

## Estructura del proyecto

```
MyChat/
├── backend/
│   ├── app.js                 # configuración de Express (middlewares, rutas)
│   ├── server.js              # punto de arranque real: crea el servidor HTTP + Socket.io
│   ├── socket.js              # helper para compartir la instancia de "io" con los controllers
│   ├── config/
│   │   └── database.js        # pool de conexión a MySQL
│   ├── middlewares/
│   │   ├── auth.js            # valida el JWT en rutas REST protegidas
│   │   └── logger.js          # logging de peticiones (Winston, rotación diaria)
│   ├── model/                 # acceso a BBDD (una clase por entidad)
│   ├── controller/             # lógica de cada endpoint
│   ├── routes/                 # definición de rutas Express
│   └── public/
│       └── backgrounds/       # imágenes disponibles como fondo de chat (se listan dinámicamente)
│
├── frontend/
│   └── src/
│       ├── stores/            # Pinia: authStore, roomsStore, themeStore, uiStore
│       ├── composables/
│       │   └── useSocket.js   # conexión Socket.io compartida por toda la app
│       ├── components/        # ChatWindow, NavUser, NavPublic, RoomInfo, SettingsUsers
│       ├── views/
│       │   ├── basic/         # zona pública: Home (layout), Index, Login, Register
│       │   └── logedUsers/    # zona privada: UserLogedLayout, Salas, JoinRoom
│       ├── router/            # rutas + guard de autenticación
│       └── config.js          # URL de la API + wrapper de fetch con JWT
│
├── Proyectos.sql              # script de creación de la base de datos
└── package.json               # scripts para arrancar todo junto (concurrently)
```

---

## Funcionalidades

- **Autenticación:** registro, login con JWT, recordar credenciales, rutas protegidas (front y back)
- **Chats individuales:** búsqueda de usuarios (`@usuario`), no aparecen hasta que hay un primer mensaje real, opción de "chat contigo mismo", eliminar chat (borrado solo para ti, revive si te vuelven a escribir)
- **Salas de grupo:** búsqueda/creación (`#sala`), invitación por enlace y QR, panel de gestión con lista de miembros, expulsar (solo el creador), reasignación automática de admin al miembro más antiguo si el creador se va, avatar de grupo
- **Mensajería en tiempo real:** Socket.io con autenticación por JWT en el handshake, historial persistente en BBDD, indicador de mensajes no leídos, actualización de la lista de chats en vivo (con polling de respaldo cada 5s)
- **Personalización:** 8 temas (4 colores × claro/oscuro) aplicados a toda la app; fondo de chat elegible entre color liso, cualquier imagen disponible en `backend/public/backgrounds/` (listado dinámico, no ligado a ningún tema — se pueden añadir o quitar imágenes sin tocar código), o una imagen personalizada subida por el propio usuario; avatar de usuario y de grupo
- **Perfil de usuario:** cambio de email, cambio de contraseña (requiere la actual), avatar
- **Otros:** selector de emojis, textarea auto-expandible, diseño responsive (una columna en móvil con navegación tipo WhatsApp)

---

## Instalación

**Requisitos previos:**
- Node.js (v18 o superior recomendado)
- MySQL Server instalado y corriendo

**1. Clona el proyecto y entra en la carpeta:**
```bash
cd MyChat
```

**2. Instala las dependencias de los 3 `package.json` (raíz, backend y frontend):**
```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

---

## Variables de entorno

Crea un archivo `.env` dentro de `backend/` con este contenido (ajusta los valores a tu entorno):

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=mychat_db

PORT=3156

JWT_SECRET=cambia_esto_por_algo_largo_y_aleatorio
```

> **Importante:** `JWT_SECRET` debe ser una cadena larga y aleatoria propia — no la compartas ni la subas a un repositorio público. Si cambia, todas las sesiones activas (tokens ya emitidos) dejan de ser válidas.

---

## Base de datos

**1. Crea la base de datos** ejecutando el script `Proyectos.sql` incluido en la raíz del proyecto (contiene las tablas `users`, `rooms`, `room_users`, `messages` con todas sus columnas y relaciones).

**2. Comprueba que MySQL acepta conexiones por TCP** (no solo por socket Unix) y que el usuario configurado en `.env` usa el plugin `mysql_native_password` si usas una versión reciente de MySQL — si no, `mysql2` puede quedarse colgado sin dar error claro:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'tu_contraseña';
FLUSH PRIVILEGES;
```

**3. Imágenes de fondo de chat:** coloca las imágenes que quieras ofrecer como fondo dentro de:
```
backend/public/backgrounds/
```
El backend expone un endpoint (`GET /backgrounds-list`) que lista automáticamente todo lo que haya en esa carpeta (formatos `.jpg`, `.jpeg`, `.png`, `.webp`), así que **no hay una cantidad ni unos nombres fijos**: para añadir o quitar opciones de fondo basta con añadir o borrar archivos ahí, sin tocar ni una línea de código. Si la carpeta está vacía, la app funciona igual — simplemente no se ofrecerá ningún preset (solo color liso e imagen personalizada).

### Esquema de tablas

| Tabla | Columna | Descripción |
|---|---|---|
| **users** | `id` | PK, autoincremental |
| | `username` | único |
| | `email` | único |
| | `password_hash` | contraseña hasheada con bcrypt |
| | `avatar` | imagen de perfil en base64 (`NULL` si no tiene) |
| | `bg_type` | `solid` \| `preset` \| `custom` — tipo de fondo de chat elegido |
| | `bg_value` | según `bg_type`: `NULL` (solid), URL de `/backgrounds/...` (preset), o base64 (custom) |
| | `created_at` | fecha de registro |
| **rooms** | `id` | PK, autoincremental |
| | `name` | nombre de la sala (solo se usa en salas de grupo; `NULL` en individuales) |
| | `type` | `individual` \| `group` |
| | `avatar` | imagen del grupo en base64 (solo aplica a `type = 'group'`) |
| | `created_by` | FK a `users.id` — creador/admin de la sala |
| | `created_at` | fecha de creación |
| **room_users** | `room_id` | FK a `rooms.id` (`ON DELETE CASCADE`) |
| | `user_id` | FK a `users.id` (`ON DELETE CASCADE`) |
| | *(PK compuesta `room_id + user_id`)* | permite el `INSERT ... ON DUPLICATE KEY UPDATE` al volver a unirse tras abandonar |
| | `joined_at` | cuándo entró (se resetea si abandona y vuelve) — determina qué historial ve |
| | `left_at` | `NULL` si está activo; fecha si abandonó (soft delete, no borra la fila) |
| | `last_read_at` | última vez que abrió el chat — para el indicador de no leídos |
| **messages** | `id` | PK, autoincremental |
| | `room_id` | FK a `rooms.id` (`ON DELETE CASCADE`) |
| | `user_id` | FK a `users.id` (`ON DELETE CASCADE`) |
| | `content` | texto del mensaje |
| | `created_at` | fecha de envío |

---

## Puesta en marcha

**Arrancar todo a la vez (backend + frontend), desde la raíz del proyecto:**
```bash
npm run dev
```

Esto levanta:
- Backend (Express + Socket.io) en `http://localhost:3156` (o el puerto que pongas en `PORT`)
- Frontend (Vite) en `http://localhost:5173`

**Arrancar por separado, si lo prefieres:**
```bash
npm run server   # solo backend
npm run client   # solo frontend
```

**Acceso desde otros dispositivos en la misma red local:** el frontend calcula la IP del backend automáticamente a partir de `window.location.hostname` (ver `frontend/src/config.js`), así que basta con acceder desde el móvil/otro PC a `http://<IP-de-tu-PC>:5173` — no hace falta tocar nada más, siempre que `vite.config.js` tenga `server: { host: true }` (ya viene así).

---

## Notas y cosas a tener en cuenta

- **Contraseñas e imágenes:** las contraseñas se guardan hasheadas con bcrypt; los avatares y fondos personalizados (subidos por el usuario) se guardan como base64 directamente en la base de datos (no hay subida de archivos a disco para estos casos), por eso funcionan igual entrando desde cualquier dispositivo. Los fondos "preset" sí son archivos reales servidos desde `backend/public/backgrounds/`.
- **Límite de tamaño de imágenes:** Express está configurado con `express.json({ limit: '10mb' })` para admitir imágenes en base64; si subes fotos muy pesadas, puede hacer falta subir ese límite.
- **Logs:** se generan por día en `backend/logs/`, con nombre `YYYY-MM-DD-app.log` (todo) y `YYYY-MM-DD-error.log` (solo errores). Se conservan automáticamente los últimos 30 días.
- **Socket.io y JWT:** la conexión de socket exige un token válido en el handshake (`auth: { token }`); si el login falla o el token caduca (7 días), hay que volver a iniciar sesión para que el chat en tiempo real funcione.
- **Rol de administrador:** el proyecto tuvo en su día un rol `admin` separado, pero se eliminó — todos los usuarios registrados tienen el mismo tipo de cuenta.