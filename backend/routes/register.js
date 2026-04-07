const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('POST /api/register body', req.body);
    
    const { name, nombre, email, password } = req.body;
    const userName = (name || nombre || '').trim();

    if (!userName || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Correo electrónico inválido.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'El correo electrónico ya está registrado (duplicado).' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // SOLUCION RAILWAY: Ejecutamos COMMIT por separado despues del INSERT
    await pool.query('BEGIN');
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING id',
      [userName, email, hashedPassword]
    );
    await pool.query('COMMIT');

    console.log('Usuario insertado correctamente id:', result.rows[0].id);
    
    return res.status(201).json({ message: 'Registro exitoso.' });
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('Error register:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;