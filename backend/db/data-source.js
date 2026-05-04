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
    id:        { primary: true, type: 'int', generated: true },
    nombre:    { type: 'varchar' },
    email:     { type: 'varchar', unique: true, nullable: true },
    telefono:  { type: 'varchar', nullable: true },
    rut:       { type: 'varchar', unique: true, nullable: true },
    rol:       { type: 'varchar' },
    estado:    { type: 'varchar', default: 'activo' },
    sede_id:   { type: 'int' },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
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
    patente: { type: 'varchar' },
    modelo:  { type: 'varchar' },
    estado:  { type: 'varchar', default: 'disponible' },
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

// ---------- Entidad: ModuloTeorico ----------
const ModuloTeorico = new EntitySchema({
  name: 'ModuloTeorico',
  tableName: 'modulos_teoricos',
  columns: {
    id:               { primary: true, type: 'int', generated: true },
    nombre:           { type: 'varchar', length: 120 },
    descripcion:      { type: 'text', nullable: true },
    horas_teoricas:   { type: 'int', default: 0 },
    orden:            { type: 'int', default: 0 },
    created_at:       { type: 'timestamp', createDate: true },
    updated_at:       { type: 'timestamp', updateDate: true },
  },
});

// ---------- Entidad: EstudianteModuloProgreso ----------
const EstudianteModuloProgreso = new EntitySchema({
  name: 'EstudianteModuloProgreso',
  tableName: 'estudiante_modulo_progreso',
  columns: {
    id:                  { primary: true, type: 'int', generated: true },
    estudiante_id:       { type: 'int' },
    modulo_id:           { type: 'int' },
    aprobado:            { type: 'boolean', default: false },
    calificacion:        { type: 'int', nullable: true },
    fecha_aprobacion:    { type: 'timestamp', nullable: true },
    created_at:          { type: 'timestamp', createDate: true },
    updated_at:          { type: 'timestamp', updateDate: true },
  },
  relations: {
    estudiante: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'estudiante_id' },
    },
    modulo: {
      type: 'many-to-one',
      target: 'ModuloTeorico',
      joinColumn: { name: 'modulo_id' },
    },
  },
});

// ---------- DataSource ----------
const AppDataSource = new DataSource({
  type: 'postgres',
  host: String(process.env.DB_HOST || 'localhost'),
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: String(process.env.DB_USER || 'postgres'),
  password: String(process.env.DB_PASSWORD || 'postgres'),
  database: String(process.env.DB_NAME || 'autoescuela'),
  synchronize: false,
  logging: false,
  entities: [Sede, Usuario, Vehiculo, Reserva, MetaKPI, ResultadoExamen, Pago, ModuloTeorico, EstudianteModuloProgreso],
});

module.exports = { AppDataSource, Sede, Usuario, Vehiculo, Reserva, MetaKPI, ResultadoExamen, Pago, ModuloTeorico, EstudianteModuloProgreso };

