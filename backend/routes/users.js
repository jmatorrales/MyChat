const express = require("express");
const router = express.Router();
const controller = require("../controller/usersController");
const { body, validationResult } = require("express-validator");

// middleware reutilizable: revisa si hubo errores de validación
const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }
  next();
};

//router.get('/', controller.getAll)

router.get("/email/:email", controller.getByEmail); // para el LOGIN (buscar por email)
router.get("/username/:username", controller.getByUsername);
router.get("/:id", controller.getById); // para uso interno (perfil, salas, mensajes...)
//* Reglas de validación del login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email no válido"),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  validar,
  controller.login
);
// reglas de validación para crear usuario
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
  controller.create, // si todo bien, sigue al controller
);
//router.put('/:id', controller.update)
//router.delete('/:id', controller.remove)

module.exports = router;
