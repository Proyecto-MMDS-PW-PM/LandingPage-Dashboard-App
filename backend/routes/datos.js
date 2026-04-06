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
      usuario: usuario.email,
      ultima_lectura: {
        flujo: '3.5 L/min',
        consumo_total: '120 L',
        fecha: new Date().toISOString(),
        estado: 'Normal'
      }
    };

    res.json(datos);

  } catch (error) {
    res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
});

module.exports = router;