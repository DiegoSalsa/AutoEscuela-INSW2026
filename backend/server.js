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
const vehiculosController = require('./controllers/vehiculos.Controller');
const { uploadImagen } = require('./middleware/upload.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Servidor HTTP (requerido por Socket.io)
const server = http.createServer(app);


initSocket(server);

// Middlewares
app.use(cors());
app.use(express.json());

app.post('/api/dashboard/vehiculos/:id/imagen', (req, res, next) => {
  uploadImagen.single('imagen')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message || 'No se pudo procesar la imagen' });
    }
    next();
  });
}, vehiculosController.uploadImagenVehiculo);

app.post('/api/vehiculos/:id/imagen', (req, res, next) => {
  uploadImagen.single('imagen')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message || 'No se pudo procesar la imagen' });
    }
    next();
  });
}, vehiculosController.uploadImagenVehiculo);

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

    server.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`WebSocket escuchando en ws://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al inicializar TypeORM:', err.message);
    process.exit(1);
  });
