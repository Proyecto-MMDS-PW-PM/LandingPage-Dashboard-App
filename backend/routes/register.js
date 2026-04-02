const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

router.post('/', async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    // Verificar si el email ya existe
    const existe = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ mensaje: 'El email ya está registrado.' });
    }

    // Hashear la contraseña
    const hash = await bcrypt.hash(password, 10);

    // Guardar en la base de datos
    await pool.query(
      'INSERT INTO usuarios (nombre, email, password, fecha_registro) VALUES ($1, $2, $3, NOW())',
      [nombre, email, hash]
    );

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor.' });
  }
});

module.exports = router;