const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
});

// verificar conexion al arrancar
pool.query('SELECT NOW()')
  .then(() => console.log('[OK] Conectado a PostgreSQL'))
  .catch((err) => console.error('[ERROR] Error de conexion a PostgreSQL:', err.message));

module.exports = pool;
