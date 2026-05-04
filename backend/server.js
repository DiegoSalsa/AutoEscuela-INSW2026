const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('[DEBUG] DB_HOST:', process.env.DB_HOST);
console.log('[DEBUG] DB_PORT:', process.env.DB_PORT);
console.log('[DEBUG] DB_USER:', process.env.DB_USER);
console.log('[DEBUG] DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('[DEBUG] DB_NAME:', process.env.DB_NAME);

const express = require('express');
const cors = require('cors');
const { AppDataSource } = require('./db/data-source');
const apiRoutes = require('./routes/index.Routes');

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares globales
app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

// health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'AutoDrive Academy — API' });
});

// inicializar TypeORM y luego levantar el servidor
AppDataSource.initialize()
  .then(() => {
    console.log('[OK] TypeORM conectado a PostgreSQL');
    app.listen(PORT, () => {
      console.log(`[SERVER] Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[ERROR] Error al inicializar TypeORM:', err.message);
    process.exit(1);
  });
