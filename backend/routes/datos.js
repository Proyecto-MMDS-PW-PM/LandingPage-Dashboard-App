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

    const lecturaResult = await pool.query(
      `SELECT litros_dia, calidad_agua, estado_filtro
       FROM lecturas
       WHERE usuario_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [usuario.id]
    );

    const alertasResult = await pool.query(
      `SELECT timestamp, tipo_alerta
       FROM alertas
       WHERE usuario_id = $1
       ORDER BY timestamp DESC
       LIMIT 5`,
      [usuario.id]
    );

    const alertas = alertasResult.rows.map(a => ({
      fecha: a.timestamp,
      tipo: a.tipo_alerta,
      descripcion:
        a.tipo_alerta === 'Filtro saturado' ? 'El filtro requiere mantenimiento urgente.' :
        a.tipo_alerta === 'Calidad baja' ? 'La calidad del agua está por debajo del umbral recomendado.' :
        'Revisión recomendada del sistema.'
    }));

    let datos;
    if (lecturaResult.rows.length > 0) {
      const lectura = lecturaResult.rows[0];
      datos = {
        litros_totales: 1250,
        litros_hoy: Math.round(parseFloat(lectura.litros_dia)),
        calidad_agua: lectura.calidad_agua,
        estado_filtro: lectura.estado_filtro,
        alertas
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
    console.error(error);
    res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
});

module.exports = router;