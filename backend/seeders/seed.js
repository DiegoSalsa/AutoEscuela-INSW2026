const pool = require('../db/db');

// helpers
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// genera un timestamp ISO para un dia y hora dados
function buildTimestamp(date, hour, minute = 0) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// datos de semilla
const SEDES = [
  { id: 1, nombre: 'Sede Central' },
  { id: 2, nombre: 'Sede Norte' },
];

const NOMBRES = [
  'Alejandro', 'Valentina', 'Matías', 'Camila', 'Sebastián',
  'Isabella', 'Diego', 'Sofía', 'Andrés', 'Luciana',
  'Nicolás', 'Martina', 'Felipe', 'Catalina', 'Tomás',
  'Renata', 'Lucas', 'Antonella', 'Emilio', 'Florencia',
  'Gabriel', 'Victoria', 'Joaquín', 'Paula', 'Daniel',
  'Mariana', 'Samuel', 'Gabriela', 'Rodrigo', 'Carolina',
  'Jorge', 'Daniela', 'Rafael', 'Andrea', 'Francisco',
  'Laura', 'Esteban', 'Natalia', 'Manuel', 'Claudia',
  'Pablo', 'Jimena', 'Adrián', 'Elena', 'Fernando',
  'Paola', 'Carlos', 'Ana', 'Héctor', 'Mónica',
];

const APELLIDOS = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González',
  'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes',
  'Cruz', 'Morales', 'Ortiz', 'Gutiérrez', 'Chávez',
];

const MODELOS = [
  'Toyota Yaris', 'Hyundai Accent', 'Kia Rio', 'Chevrolet Onix',
  'Suzuki Swift', 'Nissan Versa', 'Volkswagen Gol', 'Ford Fiesta',
  'Peugeot 208', 'Renault Clio',
];

const ESTADOS_VEHICULO = ['disponible', 'mantenimiento', 'en_sesion'];
const ESTADOS_RESERVA = ['completada', 'confirmada', 'en_progreso', 'proxima'];

// funcion principal
async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Iniciando seed...\n');
    await client.query('BEGIN');

    // 1. crear tablas
    await client.query(`
      CREATE TABLE IF NOT EXISTS sedes (
        id   SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id      SERIAL PRIMARY KEY,
        nombre  VARCHAR(150) NOT NULL,
        rol     VARCHAR(20)  NOT NULL CHECK (rol IN ('estudiante', 'instructor')),
        sede_id INTEGER      NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
        estado  VARCHAR(20)  NOT NULL DEFAULT 'activo'
      );

      CREATE TABLE IF NOT EXISTS vehiculos (
        id      SERIAL PRIMARY KEY,
        patente VARCHAR(10)  NOT NULL UNIQUE,
        modelo  VARCHAR(100) NOT NULL,
        sede_id INTEGER      NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
        estado  VARCHAR(20)  NOT NULL DEFAULT 'disponible'
          CHECK (estado IN ('disponible', 'mantenimiento', 'en_sesion'))
      );

      CREATE TABLE IF NOT EXISTS reservas (
        id             SERIAL PRIMARY KEY,
        estudiante_id  INTEGER   NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        instructor_id  INTEGER   NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        vehiculo_id    INTEGER   NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
        sede_id        INTEGER   NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
        fecha_inicio   TIMESTAMP NOT NULL,
        fecha_fin      TIMESTAMP NOT NULL,
        estado         VARCHAR(20) NOT NULL DEFAULT 'confirmada'
          CHECK (estado IN ('completada', 'confirmada', 'en_progreso', 'proxima'))
      );
    `);
    console.log('✅ Tablas creadas (si no existían)');

    // 2. limpiar datos previos
    await client.query(`
      TRUNCATE TABLE reservas, vehiculos, usuarios, sedes RESTART IDENTITY CASCADE;
    `);
    console.log('🗑️  Tablas limpiadas');

    // 3. insertar sedes
    for (const sede of SEDES) {
      await client.query(
        'INSERT INTO sedes (id, nombre) VALUES ($1, $2)',
        [sede.id, sede.nombre]
      );
    }
    console.log(`✅ ${SEDES.length} sedes insertadas`);

    // 4. insertar 50 usuarios (35 estudiantes + 15 instructores)
    const estudianteIds = [];
    const instructorIds = [];

    for (let i = 1; i <= 50; i++) {
      const nombre = `${NOMBRES[i - 1]} ${randomItem(APELLIDOS)}`;
      const rol = i <= 35 ? 'estudiante' : 'instructor';
      const sedeId = i % 2 === 0 ? 1 : 2;
      const estado = 'activo';

      const result = await client.query(
        'INSERT INTO usuarios (nombre, rol, sede_id, estado) VALUES ($1, $2, $3, $4) RETURNING id',
        [nombre, rol, sedeId, estado]
      );

      if (rol === 'estudiante') {
        estudianteIds.push(result.rows[0].id);
      } else {
        instructorIds.push(result.rows[0].id);
      }
    }
    console.log(`✅ 50 usuarios insertados (35 estudiantes, 15 instructores)`);

    // 5. insertar 20 vehiculos
    const vehiculoIds = [];
    for (let i = 1; i <= 20; i++) {
      const patente = `AA-${String(100 + i)}-BB`;
      const modelo = MODELOS[i % MODELOS.length];
      const sedeId = i <= 10 ? 1 : 2;
      // distribuir estados: 14 disponibles, 3 en_sesion, 3 mantenimiento
      let estado;
      if (i <= 3) estado = 'en_sesion';
      else if (i <= 6) estado = 'mantenimiento';
      else estado = 'disponible';

      const result = await client.query(
        'INSERT INTO vehiculos (patente, modelo, sede_id, estado) VALUES ($1, $2, $3, $4) RETURNING id',
        [patente, modelo, sedeId, estado]
      );
      vehiculoIds.push(result.rows[0].id);
    }
    console.log(`✅ 20 vehículos insertados`);

    // 6. insertar 30 reservas
    const hoy = new Date();
    // generar fechas de la ultima semana para el grafico
    const fechas = [];
    for (let d = -6; d <= 0; d++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + d);
      fechas.push(new Date(fecha));
    }

    for (let i = 0; i < 30; i++) {
      const estudianteId = randomItem(estudianteIds);
      const instructorId = randomItem(instructorIds);
      const vehiculoId = randomItem(vehiculoIds);
      const sedeId = randomItem([1, 2]);

      let fecha, estado;

      if (i < 10) {
        // 10 reservas hoy (para /clases-hoy y /uso-flota)
        fecha = hoy;
        estado = randomItem(['confirmada', 'en_progreso', 'proxima']);
      } else if (i < 22) {
        // 12 reservas repartidas en la semana pasada (para /grafico-semana)
        fecha = randomItem(fechas);
        estado = 'completada';
      } else {
        // 8 reservas completadas adicionales
        fecha = randomItem(fechas);
        estado = 'completada';
      }

      const hora = randomInt(8, 18);
      const fechaInicio = buildTimestamp(fecha, hora);
      const fechaFin = buildTimestamp(fecha, hora + 1);

      await client.query(
        `INSERT INTO reservas (estudiante_id, instructor_id, vehiculo_id, sede_id, fecha_inicio, fecha_fin, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [estudianteId, instructorId, vehiculoId, sedeId, fechaInicio, fechaFin, estado]
      );
    }
    console.log(`✅ 30 reservas insertadas`);

    await client.query('COMMIT');
    console.log('\n🎉 Seed completado exitosamente!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante el seed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
