const express = require("express");
const router = express.Router();
const controller = require("../controller/messagesController");

router.get("/room/:roomId", controller.getByRoom);

module.exports = router;