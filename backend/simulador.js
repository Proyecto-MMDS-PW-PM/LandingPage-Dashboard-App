const pool = require('./db');

async function insertarLectura() {
  try {
    const usuarios = await pool.query('SELECT id FROM usuarios');

    for (const usuario of usuarios.rows) {
      const litros = Math.floor(Math.random() * 200 + 300);
      const calidad = Math.floor(Math.random() * 20 + 75);
      const estado = calidad > 80 ? 'bueno' : 'regular';

      await pool.query(
        `INSERT INTO lecturas (usuario_id, timestamp, litros_dia, calidad_agua, estado_filtro)
         VALUES ($1, NOW(), $2, $3, $4)`,
        [usuario.id, litros, calidad, estado]
      );

      console.log(`Lectura insertada para usuario ${usuario.id}`);
    }
  } catch (error) {
    console.error('Error en simulador:', error.message);
  }
}

insertarLectura();
setInterval(insertarLectura, 60 * 60 * 1000);