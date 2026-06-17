const { faker } = require('@faker-js/faker');
const { AppDataSource } = require('../db/data-source');

const ESTADOS_VEHICULO = ['disponible', 'en_sesion', 'mantenimiento'];
const MODELOS = ['Toyota Yaris', 'Hyundai Accent', 'Kia Rio', 'Suzuki Swift', 'Nissan Versa'];

function randomDateInMonth(offsetDays = 0) {
  const base = new Date();
  base.setDate(base.getDate() + offsetDays);
  base.setHours(faker.number.int({ min: 8, max: 18 }), faker.helpers.arrayElement([0, 30]), 0, 0);
  return base;
}

async function asegurarSedes() {
  const repo = AppDataSource.getRepository('Sede');
  let sedes = await repo.find();
  if (sedes.length > 0) return sedes;

  sedes = await repo.save([
    repo.create({ nombre: 'Sede Central', direccion: 'Av. Principal 1200' }),
    repo.create({ nombre: 'Sede Norte', direccion: 'Av. Norte 450' }),
  ]);
  return sedes;
}

async function asegurarTiposClase() {
  const repo = AppDataSource.getRepository('TipoClase');
  let tipos = await repo.find();
  if (tipos.length > 0) return tipos;

  tipos = await repo.save([
    repo.create({ nombre: 'Practica Basica', descripcion: 'Clase practica inicial', duracion_min: 60, color: '#2563eb' }),
    repo.create({ nombre: 'Practica Urbana', descripcion: 'Conduccion en ciudad', duracion_min: 90, color: '#f97316' }),
  ]);
  return tipos;
}

async function asegurarModulosTeoricos() {
  const repo = AppDataSource.getRepository('ModuloTeorico');
  let modulos = await repo.find();
  if (modulos.length > 0) return modulos;

  modulos = await repo.save([
    repo.create({ nombre: 'Senales de transito', descripcion: 'Reconocimiento de senales', horas_teoricas: 4, orden: 1 }),
    repo.create({ nombre: 'Normativa vial', descripcion: 'Reglas de circulacion', horas_teoricas: 6, orden: 2 }),
    repo.create({ nombre: 'Conduccion defensiva', descripcion: 'Prevencion de riesgos', horas_teoricas: 5, orden: 3 }),
    repo.create({ nombre: 'Mecanica basica', descripcion: 'Revision preventiva del vehiculo', horas_teoricas: 3, orden: 4 }),
  ]);
  return modulos;
}

async function asegurarColumnasFlota() {
  await AppDataSource.query(`
    ALTER TABLE vehiculos
      ADD COLUMN IF NOT EXISTS kilometraje_actual int DEFAULT 0,
      ADD COLUMN IF NOT EXISTS km_ultimo_aceite int DEFAULT 0,
      ADD COLUMN IF NOT EXISTS km_ultimos_frenos int DEFAULT 0,
      ADD COLUMN IF NOT EXISTS km_proximo_mantenimiento int DEFAULT 10000,
      ADD COLUMN IF NOT EXISTS fecha_revision_tecnica date
  `);
}

async function crearInstructores(cantidad, sedes) {
  const repo = AppDataSource.getRepository('Usuario');
  const instructores = Array.from({ length: cantidad }, () => {
    const sede = faker.helpers.arrayElement(sedes);
    return repo.create({
      nombre: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      telefono: faker.phone.number(),
      rut: `${faker.number.int({ min: 7000000, max: 22000000 })}-${faker.helpers.arrayElement(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'K'])}`,
      rol: 'instructor',
      estado: 'activo',
      sede_id: sede.id,
    });
  });
  return repo.save(instructores);
}

async function obtenerOcrearInstructores(sedes) {
  const repo = AppDataSource.getRepository('Usuario');
  const existentes = await repo.findBy({ rol: 'instructor' });
  if (existentes.length >= 3) return existentes;
  return [...existentes, ...(await crearInstructores(3 - existentes.length, sedes))];
}

async function crearVehiculosDemo(cantidad, sedes) {
  await asegurarColumnasFlota();
  const creados = [];

  for (let i = 0; i < cantidad; i += 1) {
    const sede = faker.helpers.arrayElement(sedes);
    const kmActual = faker.number.int({ min: 3500, max: 85000 });
    const requiereAceite = faker.datatype.boolean({ probability: 0.35 });
    const requiereFrenos = faker.datatype.boolean({ probability: 0.25 });
    const estado = faker.helpers.arrayElement(ESTADOS_VEHICULO);
    const revision = randomDateInMonth(faker.number.int({ min: -20, max: 90 }));

    const rows = await AppDataSource.query(`
      INSERT INTO vehiculos (
        patente, modelo, estado, sede_id, kilometraje_actual,
        km_ultimo_aceite, km_ultimos_frenos, km_proximo_mantenimiento, fecha_revision_tecnica
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      faker.vehicle.vrm().slice(0, 8).toUpperCase(),
      faker.helpers.arrayElement(MODELOS),
      estado,
      sede.id,
      kmActual,
      requiereAceite ? kmActual - faker.number.int({ min: 10000, max: 16000 }) : kmActual - faker.number.int({ min: 1000, max: 8000 }),
      requiereFrenos ? kmActual - faker.number.int({ min: 20000, max: 28000 }) : kmActual - faker.number.int({ min: 2000, max: 12000 }),
      faker.number.int({ min: 9000, max: 15000 }),
      revision.toISOString().slice(0, 10),
    ]);
    creados.push(rows[0]);
  }

  return creados;
}

async function obtenerOcrearVehiculos(sedes) {
  await asegurarColumnasFlota();
  const rows = await AppDataSource.query('SELECT * FROM vehiculos ORDER BY id DESC LIMIT 20');
  if (rows.length >= 6) return rows;
  return [...rows, ...(await crearVehiculosDemo(8 - rows.length, sedes))];
}

async function crearEstudiantesDemo(cantidad, sedes) {
  const repo = AppDataSource.getRepository('Usuario');
  const estudiantes = Array.from({ length: cantidad }, () => {
    const sede = faker.helpers.arrayElement(sedes);
    return repo.create({
      nombre: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      telefono: faker.phone.number(),
      rut: `${faker.number.int({ min: 15000000, max: 26000000 })}-${faker.helpers.arrayElement(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'K'])}`,
      rol: 'estudiante',
      estado: faker.helpers.arrayElement(['activo', 'activo', 'activo', 'inactivo']),
      sede_id: sede.id,
    });
  });
  return repo.save(estudiantes);
}

async function crearProgresoTeorico(estudiantes, modulos) {
  const repo = AppDataSource.getRepository('EstudianteModuloProgreso');
  const progreso = [];

  estudiantes.forEach((estudiante) => {
    modulos.forEach((modulo) => {
      const aprobado = faker.datatype.boolean({ probability: 0.65 });
      progreso.push(repo.create({
        estudiante_id: estudiante.id,
        modulo_id: modulo.id,
        aprobado,
        calificacion: aprobado ? faker.number.int({ min: 60, max: 100 }) : faker.number.int({ min: 20, max: 59 }),
        fecha_aprobacion: aprobado ? randomDateInMonth(faker.number.int({ min: -45, max: 0 })) : null,
      }));
    });
  });

  await repo.save(progreso);
  return progreso;
}

async function crearResultadosYPagos(estudiantes) {
  const repoResultados = AppDataSource.getRepository('ResultadoExamen');
  const repoPagos = AppDataSource.getRepository('Pago');
  const resultados = [];
  const pagos = [];

  estudiantes.forEach((estudiante) => {
    resultados.push(repoResultados.create({
      estudiante_id: estudiante.id,
      aprobado: faker.datatype.boolean({ probability: 0.72 }),
      tipo_examen: faker.helpers.arrayElement(['teorico', 'practico']),
      fecha: randomDateInMonth(faker.number.int({ min: -25, max: 0 })).toISOString().slice(0, 10),
      sede_id: estudiante.sede_id,
    }));

    pagos.push(repoPagos.create({
      estudiante_id: estudiante.id,
      concepto: faker.helpers.arrayElement(['Matricula', 'Plan practico', 'Examen practico']),
      monto: faker.helpers.arrayElement([45000, 65000, 120000, 180000, 240000]),
      fecha: randomDateInMonth(faker.number.int({ min: -25, max: 0 })).toISOString().slice(0, 10),
      sede_id: estudiante.sede_id,
    }));
  });

  await Promise.all([repoResultados.save(resultados), repoPagos.save(pagos)]);
  return { resultados, pagos };
}

async function crearReservasDemo(estudiantes, instructores, vehiculos, tiposClase, cantidad) {
  const repo = AppDataSource.getRepository('Reserva');
  const reservas = Array.from({ length: cantidad }, () => {
    const estudiante = faker.helpers.arrayElement(estudiantes);
    const inicio = randomDateInMonth(faker.number.int({ min: -20, max: 12 }));
    const fin = new Date(inicio);
    fin.setMinutes(fin.getMinutes() + faker.helpers.arrayElement([60, 90]));

    return repo.create({
      estado: faker.helpers.arrayElement(['completada', 'confirmada', 'en_progreso', 'pendiente']),
      fecha_inicio: inicio,
      fecha_fin: fin,
      estudiante_id: estudiante.id,
      instructor_id: faker.helpers.arrayElement(instructores).id,
      vehiculo_id: faker.helpers.arrayElement(vehiculos).id,
      sede_id: estudiante.sede_id,
      tipo_clase_id: faker.helpers.arrayElement(tiposClase).id,
    });
  });
  return repo.save(reservas);
}

async function seedAcademicoDemo() {
  const [sedes, tiposClase, modulos] = await Promise.all([
    asegurarSedes(),
    asegurarTiposClase(),
    asegurarModulosTeoricos(),
  ]);
  const [instructores, vehiculos] = await Promise.all([
    obtenerOcrearInstructores(sedes),
    obtenerOcrearVehiculos(sedes),
  ]);
  const estudiantes = await crearEstudiantesDemo(18, sedes);
  const [progreso, finanzas] = await Promise.all([
    crearProgresoTeorico(estudiantes, modulos),
    crearResultadosYPagos(estudiantes),
  ]);
  const reservas = await crearReservasDemo(estudiantes, instructores, vehiculos, tiposClase, 28);

  return {
    mensaje: 'Datos demo academicos cargados',
    creados: {
      estudiantes: estudiantes.length,
      progresoTeorico: progreso.length,
      resultadosExamen: finanzas.resultados.length,
      pagos: finanzas.pagos.length,
      reservas: reservas.length,
    },
  };
}

async function seedFlotaDemo() {
  const [sedes, tiposClase] = await Promise.all([asegurarSedes(), asegurarTiposClase()]);
  const [instructores, estudiantes] = await Promise.all([
    obtenerOcrearInstructores(sedes),
    crearEstudiantesDemo(6, sedes),
  ]);
  const vehiculos = await crearVehiculosDemo(12, sedes);
  const reservas = await crearReservasDemo(estudiantes, instructores, vehiculos, tiposClase, 18);

  return {
    mensaje: 'Datos demo de flota cargados',
    creados: {
      vehiculos: vehiculos.length,
      reservasSincronizadas: reservas.length,
      estudiantesApoyo: estudiantes.length,
    },
  };
}

module.exports = {
  seedAcademicoDemo,
  seedFlotaDemo,
};
