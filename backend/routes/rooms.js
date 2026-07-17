const express = require("express");
const router = express.Router();
const controller = require("../controller/roomsController");
const { body, validationResult } = require("express-validator");

// middleware reutilizable: corta la petición si hay errores de validación
const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });
  next();
};

// listar las salas de un usuario (para pintar la columna izquierda)
router.get("/user/:userId", controller.getMisSalas);
router.get("/search/:query", controller.searchGroups);
router.get("/:id/info", controller.getRoomInfo);

// crear sala de GRUPO -> nombre obligatorio
router.post(
  "/group",
  [
    body("name").notEmpty().withMessage("El nombre de la sala es obligatorio"),
    body("created_by").isInt().withMessage("created_by inválido"),
  ],
  validar,
  controller.createGroup
);

// crear chat INDIVIDUAL -> sin nombre, pero con los dos usuarios
router.post(
  "/individual",
  [
    body("userA").isInt().withMessage("userA inválido"),
    body("userB").isInt().withMessage("userB inválido"),
  ],
  validar,
  controller.createIndividual
);

// añadir un usuario a una sala de grupo ya existente
router.post(
  "/add-user",
  [
    body("roomId").isInt().withMessage("roomId inválido"),
    body("userId").isInt().withMessage("userId inválido"),
  ],
  validar,
  controller.addUser
);

// Eliminamos usuarios de los grupos
router.post(
  "/remove-user",
  [
    body("roomId").isInt().withMessage("roomId inválido"),
    body("userId").isInt().withMessage("userId inválido"),
    body("requestedBy").isInt().withMessage("requestedBy inválido"),
  ],
  validar,
  controller.removeUser
);

module.exports = router;