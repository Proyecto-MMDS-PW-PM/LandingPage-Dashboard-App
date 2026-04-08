const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

router.get('/', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensaje: 'Token no proporcionado.' });
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);

    const resultado = await pool.query(
      `SELECT litros_dia, calidad_agua, estado_filtro
       FROM lecturas
       WHERE usuario_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [usuario.id]
    );

    let datos;
    if (resultado.rows.length > 0) {
      const lectura = resultado.rows[0];
      datos = {
        litros_totales: 1250,
        litros_hoy: lectura.litros_dia,
        calidad_agua: lectura.calidad_agua,
        estado_filtro: lectura.estado_filtro,
        alertas: []
      };
    } else {
      datos = {
        litros_totales: 1250,
        litros_hoy: 32,
        calidad_agua: 94,
        estado_filtro: 'bueno',
        alertas: []
      };
    }

    res.json(datos);

  } catch (error) {
    res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
});

module.exports = router;