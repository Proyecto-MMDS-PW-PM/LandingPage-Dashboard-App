const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Función auxiliar para obtener una fecha en formato YYYY-MM-DD (UTC)
function getUTCDateStr(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

router.get('/', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensaje: 'Token no proporcionado.' });
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);

    // Consulta: devuelve la fecha en formato texto (YYYY-MM-DD) usando UTC
    const resultado = await pool.query(
      `SELECT 
         TO_CHAR(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD') as fecha,
         SUM(litros_dia) as litros,
         AVG(calidad_agua) as calidad
       FROM lecturas
       WHERE usuario_id = $1
         AND timestamp >= NOW() - INTERVAL '7 days'
       GROUP BY TO_CHAR(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD')
       ORDER BY fecha ASC`,
      [usuario.id]
    );

    // Generar las 7 fechas requeridas (desde hace 6 días hasta hoy) en UTC
    const fechasRequeridas = [];
    const hoyUTC = new Date();
    hoyUTC.setUTCHours(0, 0, 0, 0); // Normalizar a medianoche UTC

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoyUTC);
      fecha.setUTCDate(hoyUTC.getUTCDate() - i);
      fechasRequeridas.push(getUTCDateStr(fecha));
    }

    // Si no hay ningún dato en los últimos 7 días, devolver simulación
    if (resultado.rows.length === 0) {
      const simulado = fechasRequeridas.map(fecha => ({
        fecha,
        litros: Math.floor(Math.random() * 200 + 300),
        calidad: Math.floor(Math.random() * 20 + 75)
      }));
      return res.json(simulado);
    }

    // Mapear los datos reales por fecha (las fechas ya son strings YYYY-MM-DD)
    const mapDatos = new Map();
    resultado.rows.forEach(row => {
      mapDatos.set(row.fecha, {
        litros: Math.round(row.litros),
        calidad: Math.round(row.calidad)
      });
    });

    // Construir el histórico completo (rellenando con ceros donde falte)
    const historicoCompleto = fechasRequeridas.map(fecha => ({
      fecha,
      litros: mapDatos.get(fecha)?.litros ?? 0,
      calidad: mapDatos.get(fecha)?.calidad ?? 0
    }));

    // Enviar la respuesta (con cabecera anti-caché opcional)
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json(historicoCompleto);

  } catch (error) {
    console.error(error);
    res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
});

module.exports = router;