const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();
console.log('loaded backend/register route');

router.post('/', async (req, res) => {
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

  let client;
  try {
    // Obtener cliente individual para manejar transaccion manualmente
    client = await pool.connect();
    
    await client.query('BEGIN TRANSACTION;');

    const existing = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK;');
      client.release();
      return res.status(409).json({ message: 'El correo electrónico ya está registrado (duplicado).' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await client.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING id, nombre, email',
      [userName, email, hashedPassword]
    );

    // ✅ COMMIT EXPLICITO (OBLIGATORIO EN RAILWAY POSTGRESQL)
    await client.query('COMMIT;');
    console.log('✅✅ USUARIO INSERTADO Y COMMIT REALIZADO EXITOSAMENTE:', result.rows[0]);
    
    client.release();

    return res.status(201).json({ 
      message: 'Registro exitoso.',
      usuario: result.rows[0] 
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK;');
      client.release();
    }
    console.error('❌ Error en /api/register:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;