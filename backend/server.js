require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);


// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'AutoDrive Academy — API' });
});

app.listen(PORT, () => {
  console.log(`🚗 Servidor corriendo en http://localhost:${PORT}`);
});