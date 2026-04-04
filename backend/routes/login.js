const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

router.post('/', async (req, res) => {
  const { email, password } = req.body;

  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1', [email]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const usuario = resultado.rows[0];
    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ mensaje: 'Login exitoso.', token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor.' });
  }
});

module.exports = router;