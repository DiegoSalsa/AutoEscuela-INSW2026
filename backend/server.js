require('dotenv').config();
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
    console.log('✅ TypeORM conectado a PostgreSQL');
    app.listen(PORT, () => {
      console.log(`🚗 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al inicializar TypeORM:', err.message);
    process.exit(1);
  });
