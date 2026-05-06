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
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar' },
    direccion: { type: 'varchar', nullable: true },
  },
});

// ---------- Entidad: Usuario ----------
const Usuario = new EntitySchema({
  name: 'Usuario',
  tableName: 'usuarios',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar' },
    email: { type: 'varchar', nullable: true },
    telefono: { type: 'varchar', nullable: true },
    rut: { type: 'varchar', nullable: true },
    rol: { type: 'varchar' },
    estado: { type: 'varchar', default: 'activo' },
    sede_id: { type: 'int' },
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
    id: { primary: true, type: 'int', generated: true },
    patente: { type: 'varchar' },
    modelo: { type: 'varchar' },
    estado: { type: 'varchar', default: 'disponible' },
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

// ---------- Entidad: TipoClase ----------
const TipoClase = new EntitySchema({
  name: 'TipoClase',
  tableName: 'tipos_clase',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar', length: 100 },
    descripcion: { type: 'varchar', length: 255, nullable: true },
    duracion_min: { type: 'int', default: 60 },
    color: { type: 'varchar', length: 7, default: "'#2563eb'" },
  },
});

// ---------- Entidad: Reserva ----------
const Reserva = new EntitySchema({
  name: 'Reserva',
  tableName: 'reservas',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    estado: { type: 'varchar', default: 'confirmada' },
    fecha_inicio: { type: 'timestamp' },
    fecha_fin: { type: 'timestamp' },
    estudiante_id: { type: 'int' },
    instructor_id: { type: 'int' },
    vehiculo_id: { type: 'int' },
    sede_id: { type: 'int' },
    tipo_clase_id: { type: 'int', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
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
    tipoClase: {
      type: 'many-to-one',
      target: 'TipoClase',
      joinColumn: { name: 'tipo_clase_id' },
      nullable: true,
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

// ---------- Entidad: ModuloTeorico (Diego) ----------
const ModuloTeorico = new EntitySchema({
  name: 'ModuloTeorico',
  tableName: 'modulos_teoricos',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    nombre: { type: 'varchar', length: 120 },
    descripcion: { type: 'text', nullable: true },
    horas_teoricas: { type: 'int', default: 0 },
    orden: { type: 'int', default: 0 },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
  },
});

// ---------- Entidad: EstudianteModuloProgreso (Diego) ----------
const EstudianteModuloProgreso = new EntitySchema({
  name: 'EstudianteModuloProgreso',
  tableName: 'estudiante_modulo_progreso',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    estudiante_id: { type: 'int' },
    modulo_id: { type: 'int' },
    aprobado: { type: 'boolean', default: false },
    calificacion: { type: 'int', nullable: true },
    fecha_aprobacion: { type: 'timestamp', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
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
  entities: [Sede, Usuario, Vehiculo, TipoClase, Reserva, MetaKPI, ModuloTeorico, EstudianteModuloProgreso, ResultadoExamen, Pago],
});

module.exports = { AppDataSource, Sede, Usuario, Vehiculo, TipoClase, Reserva, MetaKPI, ModuloTeorico, EstudianteModuloProgreso, ResultadoExamen, Pago };
