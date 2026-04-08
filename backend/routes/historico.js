const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

router.get('/', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado.' });

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);

    // Fechas en UTC: desde hace 6 días hasta hoy
    const hoyUTC = new Date();
    hoyUTC.setUTCHours(0, 0, 0, 0);
    const hace7Dias = new Date(hoyUTC);
    hace7Dias.setUTCDate(hoyUTC.getUTCDate() - 6);

    const resultado = await pool.query(
      `SELECT 
        (timestamp AT TIME ZONE 'America/Mexico_City')::date as fecha,
        SUM(litros_dia) as litros,
        AVG(calidad_agua) as calidad
      FROM lecturas
      WHERE usuario_id = $1
        AND timestamp >= (NOW() AT TIME ZONE 'America/Mexico_City') - INTERVAL '7 days'
      GROUP BY fecha
      ORDER BY fecha ASC`,
      [usuario.id, hace7Dias]
    );

    // Generar las 7 fechas requeridas en UTC (formato YYYY-MM-DD)
    // Función para obtener fecha en formato YYYY-MM-DD en la zona horaria local de México
    function getLocalDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const hoyLocal = new Date(); // ya está en la zona horaria del servidor (si configuraste bien)
    const fechasRequeridas = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoyLocal);
      d.setDate(hoyLocal.getDate() - i);
      fechasRequeridas.push(getLocalDate(d));
    }

    // Mapear los datos de la BD
    const mapDatos = new Map();
    resultado.rows.forEach(row => {
      // row.fecha ya es string (porque ::date devuelve date, pero pg lo convierte a Date)
      const fechaStr = row.fecha instanceof Date
        ? row.fecha.toISOString().split('T')[0]
        : row.fecha;
      mapDatos.set(fechaStr, {
        litros: Math.round(row.litros),
        calidad: Math.round(row.calidad)
      });
    });

    // Construir el array completo (rellenando con ceros donde no haya datos)
    const historicoCompleto = fechasRequeridas.map(fecha => ({
      fecha,
      litros: mapDatos.get(fecha)?.litros ?? 0,
      calidad: mapDatos.get(fecha)?.calidad ?? 0
    }));

    res.json(historicoCompleto);
  } catch (error) {
    console.error(error);
    res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
});

module.exports = router;