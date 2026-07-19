const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Lista los nombres de archivo de todas las imágenes disponibles en public/backgrounds.
// Así el front no depende de una lista fija: basta con añadir/quitar archivos en esa carpeta.
router.get("/", (req, res) => {
  const carpeta = path.join(__dirname, "../public/backgrounds");
  fs.readdir(carpeta, (err, archivos) => {
    if (err) return res.status(500).json({ error: "No se pudieron listar los fondos" });

    // filtramos solo imágenes, por si se cuela algún archivo que no toca
    const imagenes = archivos.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
    res.json(imagenes);
  });
});

module.exports = router;