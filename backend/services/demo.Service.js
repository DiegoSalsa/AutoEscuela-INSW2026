const { fakerES: faker } = require('@faker-js/faker');
const { AppDataSource } = require('../db/data-source');

const DEMO_DOMAIN = 'demo-autodrive.cl';

const NOMBRES = [
  'Sofia', 'Martina', 'Antonia', 'Florencia', 'Isidora', 'Josefa', 'Valentina', 'Catalina',
  'Camila', 'Constanza', 'Javiera', 'Francisca', 'Daniela', 'Fernanda', 'Ignacia', 'Trinidad',
  'Benjamin', 'Vicente', 'Matias', 'Agustin', 'Tomas', 'Maximiliano', 'Joaquin', 'Sebastian',
  'Nicolas', 'Ignacio', 'Cristobal', 'Diego', 'Felipe', 'Francisco', 'Rodrigo', 'Pablo',
];

const APELLIDOS = [
  'Gonzalez', 'Munoz', 'Rojas', 'Diaz', 'Perez', 'Soto', 'Contreras', 'Silva',
  'Martinez', 'Sepulveda', 'Morales', 'Rodriguez', 'Lopez', 'Fuentes', 'Hernandez', 'Torres',
  'Araya', 'Flores', 'Espinoza', 'Valenzuela', 'Castillo', 'Ramirez', 'Reyes', 'Gutierrez',
];

const ESTADOS_VEHICULO = ['disponible', 'en_sesion', 'mantenimiento'];
const MODELOS = ['Toyota Yaris', 'Hyundai Accent', 'Kia Rio', 'Suzuki Swift', 'Nissan Versa', 'Chevrolet Sail', 'MG 3'];
const ESPECIALIDADES = ['Clase B', 'Clase C (Motos)', 'Clase A (Profesional)'];
const ESTADOS_INSTRUCTOR = ['activo', 'activo', 'activo', 'activo', 'licencia_medica', 'vacaciones'];
const TURNOS = ['Manana', 'Tarde', 'Completo', 'Fin de Semana'];

function normalizar(valor) {
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function personaChilena() {
  const nombre = faker.helpers.arrayElement(NOMBRES);
  const apellido1 = faker.helpers.arrayElement(APELLIDOS);
  let apellido2 = faker.helpers.arrayElement(APELLIDOS);
  if (apellido2 === apellido1) apellido2 = faker.helpers.arrayElement(APELLIDOS);
  const sufijo = faker.number.int({ min: 100, max: 9999 });
  return {
    nombreCompleto: `${nombre} ${apellido1} ${apellido2}`,
    email: `${normalizar(nombre)}.${normalizar(apellido1)}.${sufijo}@${DEMO_DOMAIN}`,
  };
}

function digitoVerificadorRut(numero) {
  let suma = 0;
  let multiplicador = 2;
  for (const digito of String(numero).split('').reverse()) {
    suma += Number(digito) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

function rutChileno(min = 7000000, max = 26000000) {
  const numero = faker.number.int({ min, max });
  return `${numero}-${digitoVerificadorRut(numero)}`;
}

function telefonoChileno() {
  return `+56 9 ${faker.string.numeric(4)} ${faker.string.numeric(4)}`;
}

function patenteChilena() {
  const letras = 'BCDFGHJKLMNPRSTVWXYZ';
  const letra = () => faker.helpers.arrayElement(letras.split(''));
  return `${letra()}${letra()}-${letra()}${letra()}-${faker.string.numeric(2)}`;
}

function randomDateInMonth(offsetDays = 0) {
  const base = new Date();
  base.setDate(base.getDate() + offsetDays);
  base.setHours(faker.number.int({ min: 8, max: 18 }), faker.helpers.arrayElement([0, 30]), 0, 0);
  return base;
}

function fechaDemoMesActual(dayOffset = 0) {
  const fecha = new Date();
  fecha.setDate(Math.max(1, fecha.getDate() - dayOffset));
  fecha.setHours(faker.number.int({ min: 9, max: 17 }), faker.helpers.arrayElement([0, 30]), 0, 0);
  return fecha;
}

// ── Funciones de asegurar datos base ──

async function asegurarSedes() {
  const repo = AppDataSource.getRepository('Sede');
  let sedes = await repo.find();
  if (sedes.length > 0) return sedes;

  sedes = await repo.save([
    repo.create({ nombre: 'Sede Central', direccion: 'Av. Providencia 1200, Santiago' }),
    repo.create({ nombre: 'Sede Norte', direccion: 'Av. Independencia 450, Santiago' }),
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

// ── Funciones de creación de datos ──

async function crearEstudiantesDemo(cantidad, sedes, demoSeed) {
  const repo = AppDataSource.getRepository('Usuario');
  const estudiantes = [];

  for (let i = 0; i < cantidad; i++) {
    const persona = personaChilena();
    const estudiante = await repo.save(
      repo.create({
        nombre: persona.nombreCompleto,
        email: persona.email,
        telefono: telefonoChileno(),
        rut: rutChileno(15000000, 26000000),
        rol: 'estudiante',
        estado: 'activo',
        sede_id: faker.helpers.arrayElement(sedes).id,
        demo_seed: demoSeed,
      })
    );
    estudiantes.push(estudiante);
  }

  return estudiantes;
}

async function crearInstructoresDemo(cantidad, sedes, demoSeed, extendidos = false) {
  const repo = AppDataSource.getRepository('Usuario');
  const instructores = [];

  for (let i = 0; i < cantidad; i++) {
    const persona = personaChilena();
    const data = {
      nombre: persona.nombreCompleto,
      email: persona.email,
      telefono: telefonoChileno(),
      rut: rutChileno(7000000, 22000000),
      rol: 'instructor',
      estado: extendidos ? faker.helpers.arrayElement(ESTADOS_INSTRUCTOR) : 'activo',
      sede_id: faker.helpers.arrayElement(sedes).id,
      demo_seed: demoSeed,
    };

    if (extendidos) {
      data.especialidad = faker.helpers.arrayElement(ESPECIALIDADES);
      data.anios_experiencia = faker.number.int({ min: 1, max: 18 });
      data.calificacion_promedio = faker.number.float({ min: 3.2, max: 5.0, fractionDigits: 1 });
      data.total_clases_completadas = faker.number.int({ min: 40, max: 950 });
      data.turno = faker.helpers.arrayElement(TURNOS);
    }

    const instructor = await repo.save(repo.create(data));
    instructores.push(instructor);
  }

  return instructores;
}

async function crearVehiculosDemo(cantidad, sedes, demoSeed) {
  const repo = AppDataSource.getRepository('Vehiculo');
  const creados = [];

  for (let i = 0; i < cantidad; i++) {
    const kmActual = faker.number.int({ min: 3500, max: 85000 });
    const requiereAceite = faker.datatype.boolean({ probability: 0.35 });
    const requiereFrenos = faker.datatype.boolean({ probability: 0.25 });
    const revision = randomDateInMonth(faker.number.int({ min: -20, max: 90 }));

    const vehiculo = await repo.save(
      repo.create({
        patente: patenteChilena(),
        modelo: faker.helpers.arrayElement(MODELOS),
        estado: faker.helpers.arrayElement(ESTADOS_VEHICULO),
        sede_id: faker.helpers.arrayElement(sedes).id,
        kilometraje_actual: kmActual,
        km_ultimo_aceite: requiereAceite
          ? kmActual - faker.number.int({ min: 10000, max: 16000 })
          : kmActual - faker.number.int({ min: 1000, max: 8000 }),
        km_ultimos_frenos: requiereFrenos
          ? kmActual - faker.number.int({ min: 20000, max: 28000 })
          : kmActual - faker.number.int({ min: 2000, max: 12000 }),
        km_proximo_mantenimiento: faker.number.int({ min: 9000, max: 15000 }),
        fecha_revision_tecnica: revision.toISOString().slice(0, 10),
        demo_seed: demoSeed,
      })
    );
    creados.push(vehiculo);
  }

  return creados;
}

async function crearVehiculosFlotaDemo(sedes, demoSeed) {
  const repo = AppDataSource.getRepository('Vehiculo');
  const estados = ['disponible', 'en_sesion', 'mantenimiento'];
  const creados = [];

  for (const estado of estados) {
    const kmActual = faker.number.int({ min: 3500, max: 85000 });
    const vehiculo = await repo.save(
      repo.create({
        patente: patenteChilena(),
        modelo: faker.helpers.arrayElement(MODELOS),
        estado,
        sede_id: faker.helpers.arrayElement(sedes).id,
        kilometraje_actual: kmActual,
        km_ultimo_aceite: kmActual - faker.number.int({ min: 1000, max: 16000 }),
        km_ultimos_frenos: kmActual - faker.number.int({ min: 2000, max: 28000 }),
        km_proximo_mantenimiento: faker.number.int({ min: 9000, max: 15000 }),
        fecha_revision_tecnica: randomDateInMonth(faker.number.int({ min: -20, max: 90 })).toISOString().slice(0, 10),
        demo_seed: demoSeed,
      })
    );
    creados.push(vehiculo);
  }

  return creados;
}

async function crearReservasCompletadasDemo(estudiantes, tiposClase, demoSeed) {
  const repoReservas = AppDataSource.getRepository('Reserva');
  const repoUsuarios = AppDataSource.getRepository('Usuario');
  const repoVehiculos = AppDataSource.getRepository('Vehiculo');
  const reservas = [];

  for (let i = 0; i < estudiantes.length; i++) {
    const estudiante = estudiantes[i];
    const fechaInicio = fechaDemoMesActual(i);
    const fechaFin = new Date(fechaInicio.getTime() + 60 * 60 * 1000);

    const [instructor, vehiculo] = await Promise.all([
      repoUsuarios.findOne({ where: { rol: 'instructor', estado: 'activo', sede_id: estudiante.sede_id } }),
      repoVehiculos.findOne({ where: { sede_id: estudiante.sede_id } }),
    ]);

    const reserva = await repoReservas.save(
      repoReservas.create({
        estado: 'completada',
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estudiante_id: estudiante.id,
        instructor_id: instructor?.id || null,
        vehiculo_id: vehiculo?.id || null,
        sede_id: estudiante.sede_id,
        tipo_clase_id: faker.helpers.arrayElement(tiposClase)?.id || null,
        demo_seed: demoSeed,
      })
    );
    reservas.push(reserva);
  }

  return reservas;
}

async function crearProgresoTeorico(estudiantes, modulos, demoSeed) {
  const repo = AppDataSource.getRepository('EstudianteModuloProgreso');
  const progreso = [];

  for (const estudiante of estudiantes) {
    for (const modulo of modulos) {
      const aprobado = faker.datatype.boolean({ probability: 0.65 });
      const registro = await repo.save(
        repo.create({
          estudiante_id: estudiante.id,
          modulo_id: modulo.id,
          aprobado,
          calificacion: aprobado ? faker.number.int({ min: 60, max: 100 }) : faker.number.int({ min: 20, max: 59 }),
          fecha_aprobacion: aprobado ? randomDateInMonth(faker.number.int({ min: -45, max: 0 })) : null,
          demo_seed: demoSeed,
        })
      );
      progreso.push(registro);
    }
  }

  return progreso;
}

async function crearResultadosYPagos(estudiantes, demoSeed) {
  const repoResultados = AppDataSource.getRepository('ResultadoExamen');
  const repoPagos = AppDataSource.getRepository('Pago');
  const resultados = [];
  const pagos = [];

  for (let idx = 0; idx < estudiantes.length; idx++) {
    const estudiante = estudiantes[idx];
    const fechaBase = fechaDemoMesActual(idx).toISOString().slice(0, 10);
    const resultado = await repoResultados.save(
      repoResultados.create({
        estudiante_id: estudiante.id,
        aprobado: idx === 0 ? true : faker.datatype.boolean({ probability: 0.72 }),
        tipo_examen: faker.helpers.arrayElement(['teorico', 'practico']),
        fecha: fechaBase,
        sede_id: estudiante.sede_id,
        demo_seed: demoSeed,
      })
    );
    resultados.push(resultado);

    for (let i = 0; i < 5; i++) {
      const pago = await repoPagos.save(
        repoPagos.create({
          estudiante_id: estudiante.id,
          concepto: faker.helpers.arrayElement(['Matricula', 'Plan practico', 'Examen practico', 'Clase extra', 'Material de estudio']),
          monto: faker.helpers.arrayElement([45000, 65000, 120000, 180000, 240000]),
          fecha: fechaBase,
          sede_id: estudiante.sede_id,
          demo_seed: demoSeed,
        })
      );
      pagos.push(pago);
    }
  }

  return { resultados, pagos };
}

// ── Funciones seed principales ──

async function seedAcademicoDemo() {
  const [sedes, modulos, tiposClase] = await Promise.all([
    asegurarSedes(),
    asegurarModulosTeoricos(),
    asegurarTiposClase(),
  ]);

  const demoSeed = 'academico';
  const estudiantes = await crearEstudiantesDemo(2, sedes, demoSeed);
  const progreso = await crearProgresoTeorico(estudiantes, modulos, demoSeed);
  const finanzas = await crearResultadosYPagos(estudiantes, demoSeed);
  const reservas = await crearReservasCompletadasDemo(estudiantes, tiposClase, demoSeed);

  return {
    mensaje: 'Datos de prueba generados correctamente',
    creados: {
      Estudiantes: estudiantes.length,
      ClasesCompletadas: reservas.length,
      PagosRegistrados: finanzas.pagos.length,
    },
  };
}

async function seedFlotaDemo() {
  const sedes = await asegurarSedes();
  const demoSeed = 'flota';
  const vehiculos = await crearVehiculosFlotaDemo(sedes, demoSeed);

  return {
    mensaje: 'Vehículos de prueba generados correctamente',
    creados: {
      VehiculosNuevos: vehiculos.length,
    },
  };
}

async function seedInstructoresDemo() {
  const sedes = await asegurarSedes();
  const instructores = await crearInstructoresDemo(1, sedes, 'instructores', true);

  return {
    mensaje: 'Instructores de prueba generados correctamente',
    creados: {
      Instructores: instructores.length,
    },
  };
}

// ── Funciones de limpieza ──

async function limpiarAcademicoDemo() {
  const repoProgreso = AppDataSource.getRepository('EstudianteModuloProgreso');
  const repoResultados = AppDataSource.getRepository('ResultadoExamen');
  const repoPagos = AppDataSource.getRepository('Pago');
  const repoReservas = AppDataSource.getRepository('Reserva');
  const repoUsuarios = AppDataSource.getRepository('Usuario');

  const progreso = await repoProgreso.find({ where: { demo_seed: 'academico' } });
  if (progreso.length) await repoProgreso.remove(progreso);

  const resultados = await repoResultados.find({ where: { demo_seed: 'academico' } });
  if (resultados.length) await repoResultados.remove(resultados);

  const pagos = await repoPagos.find({ where: { demo_seed: 'academico' } });
  if (pagos.length) await repoPagos.remove(pagos);

  const reservas = await repoReservas.find({ where: { demo_seed: 'academico' } });
  if (reservas.length) await repoReservas.remove(reservas);

  const usuarios = await repoUsuarios.find({ where: { demo_seed: 'academico' } });
  if (usuarios.length) await repoUsuarios.remove(usuarios);

  return {
    mensaje: 'Datos de prueba académicos eliminados',
    eliminados: {
      Estudiantes: usuarios.length,
      Progreso: progreso.length,
      Resultados: resultados.length,
      Pagos: pagos.length,
      Reservas: reservas.length,
    },
  };
}

async function limpiarFlotaDemo() {
  const repoReservas = AppDataSource.getRepository('Reserva');
  const repoVehiculos = AppDataSource.getRepository('Vehiculo');

  const reservas = await repoReservas.find({ where: { demo_seed: 'flota' } });
  if (reservas.length) await repoReservas.remove(reservas);

  const vehiculos = await repoVehiculos.find({ where: { demo_seed: 'flota' } });
  if (vehiculos.length) await repoVehiculos.remove(vehiculos);

  return {
    mensaje: 'Datos de prueba de flota eliminados',
    eliminados: {
      Vehiculos: vehiculos.length,
      Reservas: reservas.length,
    },
  };
}

async function limpiarInstructoresDemo() {
  const repoReservas = AppDataSource.getRepository('Reserva');
  const repoUsuarios = AppDataSource.getRepository('Usuario');

  const reservas = await repoReservas.find({ where: { demo_seed: 'instructores' } });
  if (reservas.length) await repoReservas.remove(reservas);

  const usuarios = await repoUsuarios.find({ where: { demo_seed: 'instructores' } });
  if (usuarios.length) await repoUsuarios.remove(usuarios);

  return {
    mensaje: 'Datos de prueba de instructores eliminados',
    eliminados: {
      Instructores: usuarios.length,
      Reservas: reservas.length,
    },
  };
}

async function limpiarTodoDemo() {
  const repoProgreso = AppDataSource.getRepository('EstudianteModuloProgreso');
  const repoResultados = AppDataSource.getRepository('ResultadoExamen');
  const repoPagos = AppDataSource.getRepository('Pago');
  const repoReservas = AppDataSource.getRepository('Reserva');
  const repoVehiculos = AppDataSource.getRepository('Vehiculo');
  const repoUsuarios = AppDataSource.getRepository('Usuario');

  const progreso = await repoProgreso.find();
  if (progreso.length) await repoProgreso.remove(progreso);

  const resultados = await repoResultados.find();
  if (resultados.length) await repoResultados.remove(resultados);

  const pagos = await repoPagos.find();
  if (pagos.length) await repoPagos.remove(pagos);

  const reservas = await repoReservas.find();
  if (reservas.length) await repoReservas.remove(reservas);

  const vehiculos = await repoVehiculos.find();
  if (vehiculos.length) await repoVehiculos.remove(vehiculos);

  const usuarios = await repoUsuarios
    .createQueryBuilder('u')
    .where("u.rol IN ('estudiante', 'instructor')")
    .orWhere('u.demo_seed IS NOT NULL')
    .getMany();
  if (usuarios.length) await repoUsuarios.remove(usuarios);

  return {
    mensaje: 'Todos los datos de prueba eliminados',
    eliminados: {
      Usuarios: usuarios.length,
      Vehiculos: vehiculos.length,
      Reservas: reservas.length,
      Progreso: progreso.length,
      Resultados: resultados.length,
      Pagos: pagos.length,
    },
  };
}

module.exports = {
  seedAcademicoDemo,
  seedFlotaDemo,
  seedInstructoresDemo,
  limpiarAcademicoDemo,
  limpiarFlotaDemo,
  limpiarInstructoresDemo,
  limpiarTodoDemo,
};
