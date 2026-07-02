// data-source.js — Configuracion de conexion a PostgreSQL con TypeORM
const { DataSource } = require('typeorm');
require('dotenv').config();

const entities = require('../entity');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'autoescuela',
  synchronize: true,
  logging: false,
  entities: Object.values(entities),
  // Zona horaria de Chile para que NOW() y los timestamps sean correctos
  extra: {
    options: "-c timezone=America/Santiago",
  },
});

module.exports = { AppDataSource, ...entities };
