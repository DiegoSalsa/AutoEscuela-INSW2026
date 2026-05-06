require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { AppDataSource } = require('./db/data-source');
const apiRoutes = require('./routes/index.Routes');
const { initSocket } = require('./services/socket');
const { initMailer } = require('./services/notificaciones.Service');
const { iniciarScheduler } = require('./jobs/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear servidor HTTP (requerido por Socket.io)
const server = http.createServer(app);

// Inicializar Socket.io
initSocket(server);

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
  .then(async () => {
    console.log('[BD] TypeORM conectado a PostgreSQL');

    // Inicializar Nodemailer (async por si usa Ethereal)
    await initMailer();

    // Iniciar tareas programadas (cron jobs)
    iniciarScheduler();

    server.listen(PORT, () => {
      console.log(`[Server] Servidor corriendo en http://localhost:${PORT}`);
      console.log(`[Socket] WebSocket escuchando en ws://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Error] Error al inicializar TypeORM:', err.message);
    process.exit(1);
  });
