require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'AutoDrive Academy — Dashboard API' });
});

app.listen(PORT, () => {
  console.log(`🚗 Servidor corriendo en http://localhost:${PORT}`);
});
