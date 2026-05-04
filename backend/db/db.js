require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: String(process.env.DB_USER || 'postgres'),
  password: String(process.env.DB_PASSWORD || 'postgres'),
  host: String(process.env.DB_HOST || 'localhost'),
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: String(process.env.DB_NAME || 'autoescuela'),
});

// verificar conexion al arrancar
pool.query('SELECT NOW()')
  .then(() => console.log('[OK] Conectado a PostgreSQL'))
  .catch((err) => console.error('[ERROR] Error de conexion a PostgreSQL:', err.message));

module.exports = pool;
