// Zona horaria: Santiago, Chile
process.env.TZ = 'America/Santiago';
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
const HOST = process.env.HOST || '0.0.0.0';

// Servidor HTTP (requerido por Socket.io)
const server = http.createServer(app);


initSocket(server);

// Middlewares
app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);


app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'AutoDrive Academy — API' });
});

// Inicializar TypeORM y levantar el servidor
AppDataSource.initialize()
  .then(async () => {
    console.log('TypeORM conectado a PostgreSQL');


    await initMailer();


    iniciarScheduler();

    server.listen(PORT, HOST, () => {
      console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
      console.log(`WebSocket escuchando en ws://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al inicializar TypeORM:', err.message);
    process.exit(1);
  });
