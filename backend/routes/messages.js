const express = require("express");
const router = express.Router();
const controller = require("../controller/messagesController");

// historial de una sala, filtrado a partir de cuándo ESE usuario entró/reentró
router.get("/room/:roomId/:userId", controller.getByRoom);

module.exports = router;