const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.get('/', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensaje: 'Token no proporcionado.' });
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);

    const datos = {
      litros_totales: 1250,        // Puede venir de BD o ser fijo por ahora
      litros_hoy: 32,
      calidad_agua: 94,
      estado_filtro: "bueno",
      alertas: []
    };
    res.json(datos);

  } catch (error) {
    res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
});

module.exports = router;