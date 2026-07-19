// Importaciones
const express = require("express");
const router = express.Router();
const controller = require("../controller/usersController");
const { body, validationResult } = require("express-validator");
const auth = require("../middlewares/auth");

// Middleware reutilizable: si express-validator detectó errores, corta aquí con un 400
const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }
  next();
};

//router.get('/', controller.getAll) // listar todos - sin usar por ahora (sin protección de admin)

router.get("/email/:email", controller.getByEmail); // usado internamente para el LOGIN (buscar por email exacto)
router.get("/username/:username", controller.getByUsername); // comprobar si un username ya está en uso (registro)
router.get("/search/:query", auth, controller.search); // buscador de usuarios por coincidencia parcial (nuevo chat)
router.get("/:id", auth, controller.getById); // uso interno: perfil, salas, mensajes...
router.post("/background", auth, controller.updateBackground);
router.post("/avatar", auth, controller.updateAvatar);
router.post("/email", auth, controller.updateEmail);
router.post(
  "/password",  auth,
  [
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("La nueva contraseña debe tener al menos 6 caracteres"),
  ],
  validar,
  controller.updatePassword,
);

// login: valida formato de email y que password no esté vacío
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email no válido"),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  validar,
  controller.login,
);

// registro: valida username, email y longitud mínima de password
router.post(
  "/",
  [
    body("username").notEmpty().withMessage("El username es obligatorio"),
    body("email").isEmail().withMessage("Email no válido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres"),
  ],
  validar, // si hay errores, corta aquí y devuelve 400
  controller.create,
);

//router.put('/:id', controller.update)   // pendiente
//router.delete('/:id', controller.remove) // pendiente

module.exports = router;
