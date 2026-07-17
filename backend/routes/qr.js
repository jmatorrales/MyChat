const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

// Genera un QR a partir de cualquier URL que le pases por query (?url=...)
router.get('/', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Falta el parámetro url' });

    const qr = await QRCode.toDataURL(url); // dataURL listo para un <img :src="...">
    res.json({ qr });
  } catch (err) {
    console.error('Error generando QR:', err);
    res.status(500).json({ error: 'Error al generar el QR' });
  }
});

module.exports = router;