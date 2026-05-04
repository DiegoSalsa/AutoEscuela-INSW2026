// ===================================================================
// data-source.js — Configuracion TypeORM (JavaScript puro, sin TS)
// ===================================================================
const { DataSource, EntitySchema } = require('typeorm');
require('dotenv').config();

// ---------- Entidad: Sede ----------
const Sede = new EntitySchema({
  name: 'Sede',
  tableName: 'sedes',
  columns: {
    id:     { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar' },
  },
});

// ---------- Entidad: Usuario ----------
const Usuario = new EntitySchema({
  name: 'Usuario',
  tableName: 'usuarios',
  columns: {
    id:      { primary: true, type: 'int', generated: true },
    nombre:  { type: 'varchar' },
    rol:     { type: 'varchar' },
    estado:  { type: 'varchar', default: 'activo' },
    sede_id: { type: 'int' },
  },
  relations: {
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' },
    },
  },
});

// ---------- Entidad: Vehiculo ----------
const Vehiculo = new EntitySchema({
  name: 'Vehiculo',
  tableName: 'vehiculos',
  columns: {
    id:      { primary: true, type: 'int', generated: true },
    patente: { type: 'varchar', unique: true },
    modelo:  { type: 'varchar' },
    estado:  { type: 'varchar', default: 'disponible' },
    sede_id: { type: 'int' },
    kilometraje_actual: { type: 'int', default: 0 },
    km_ultimo_aceite: { type: 'int', nullable: true },
    km_ultimos_frenos: { type: 'int', nullable: true },
    km_proximo_mantenimiento: { type: 'int', nullable: true },
    fecha_revision_tecnica: { type: 'date', nullable: true },
  },
  relations: {
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' },
    },
  },
});

// ---------- Entidad: Reserva ----------
const Reserva = new EntitySchema({
  name: 'Reserva',
  tableName: 'reservas',
  columns: {
    id:              { primary: true, type: 'int', generated: true },
    estado:          { type: 'varchar', default: 'confirmada' },
    fecha_inicio:    { type: 'timestamp' },
    fecha_fin:       { type: 'timestamp' },
    estudiante_id:   { type: 'int' },
    instructor_id:   { type: 'int' },
    vehiculo_id:     { type: 'int' },
    sede_id:         { type: 'int' },
  },
  relations: {
    estudiante: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'estudiante_id' },
    },
    instructor: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'instructor_id' },
    },
    vehiculo: {
      type: 'many-to-one',
      target: 'Vehiculo',
      joinColumn: { name: 'vehiculo_id' },
    },
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' },
    },
  },
});

// ---------- Entidad NUEVA: MetaKPI ----------
const MetaKPI = new EntitySchema({
  name: 'MetaKPI',
  tableName: 'metas_kpi',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    metrica_nombre: {
      type: 'varchar',
      length: 120,
    },
    valor_esperado: {
      type: 'int',
    },
    mes_anio: {
      type: 'varchar',
      length: 7,
    },
    sede_id: {
      type: 'int',
      nullable: true,
    },
    creado_en: {
      type: 'timestamp',
      createDate: true,
    },
    actualizado_en: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {
    sede: {
      type: 'many-to-one',
      target: 'Sede',
      joinColumn: { name: 'sede_id' },
      nullable: true,
    },
  },
});

// ---------- Entidad: ResultadoExamen ----------
const ResultadoExamen = new EntitySchema({
  name: 'ResultadoExamen',
  tableName: 'resultados_examen',
  columns: {
    id:             { primary: true, type: 'int', generated: true },
    estudiante_id:  { type: 'int' },
    aprobado:       { type: 'boolean' },
    tipo_examen:    { type: 'varchar', length: 30, default: 'practico' },
    fecha:          { type: 'date' },
    sede_id:        { type: 'int' },
  },
  relations: {
    estudiante: { type: 'many-to-one', target: 'Usuario', joinColumn: { name: 'estudiante_id' } },
    sede:       { type: 'many-to-one', target: 'Sede', joinColumn: { name: 'sede_id' } },
  },
});

// ---------- Entidad: Pago ----------
const Pago = new EntitySchema({
  name: 'Pago',
  tableName: 'pagos',
  columns: {
    id:             { primary: true, type: 'int', generated: true },
    estudiante_id:  { type: 'int' },
    concepto:       { type: 'varchar', length: 80 },
    monto:          { type: 'decimal', precision: 10, scale: 2 },
    fecha:          { type: 'date' },
    sede_id:        { type: 'int' },
  },
  relations: {
    estudiante: { type: 'many-to-one', target: 'Usuario', joinColumn: { name: 'estudiante_id' } },
    sede:       { type: 'many-to-one', target: 'Sede', joinColumn: { name: 'sede_id' } },
  },
});

// ---------- DataSource ----------
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'autoescuela',
  synchronize: false,
  logging: false,
  entities: [Sede, Usuario, Vehiculo, Reserva, MetaKPI, ResultadoExamen, Pago],
});

module.exports = { AppDataSource, Sede, Usuario, Vehiculo, Reserva, MetaKPI, ResultadoExamen, Pago };

