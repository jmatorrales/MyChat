const express = require("express");
const router = express.Router();
const controller = require("../controller/messagesController");
const auth = require("../middlewares/auth");

// historial de una sala, filtrado a partir de cuándo ESE usuario entró/reentró
router.get("/room/:roomId/:userId", auth, controller.getByRoom);

module.exports = router;