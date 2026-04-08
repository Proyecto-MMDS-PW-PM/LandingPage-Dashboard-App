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
      `SELECT 
        DATE(timestamp) as fecha,
        SUM(litros_dia) as litros,
        AVG(calidad_agua) as calidad
       FROM lecturas
       WHERE usuario_id = $1
         AND timestamp >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(timestamp)
       ORDER BY fecha ASC`,
      [usuario.id]
    );

    if (resultado.rows.length === 0) {
      const hoy = new Date();
      const simulado = Array.from({ length: 7 }, (_, i) => {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() - (6 - i));
        return {
          fecha: fecha.toISOString().split('T')[0],
          litros: Math.floor(Math.random() * 200 + 300),
          calidad: Math.floor(Math.random() * 20 + 75)
        };
      });
      return res.json(simulado);
    }

    // Después de obtener resultado.rows
    const fechasRequeridas = [];
    // Generar fechas en orden: hace 6 dias, hace 5 dias ... hasta hoy
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0); // Corregir problema de zona horaria
      d.setDate(d.getDate() - i);
      fechasRequeridas.push(d.toISOString().split('T')[0]);
    }

    const mapDatos = new Map();
    resultado.rows.forEach(row => {
      const fechaStr = row.fecha.toISOString().split('T')[0];
      mapDatos.set(fechaStr, {
        litros: Math.round(row.litros),
        calidad: Math.round(row.calidad)
      });
    });

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