const reservasService = require('../services/reservas.Service');
const { emitirEventoReserva } = require('../services/socket');
const { enviarConfirmacion } = require('../services/notificaciones.Service');
const { AppDataSource } = require('../db/data-source');

const crearReserva = async (req, res) => {
  try {
    const nuevaReserva = await reservasService.crearReservaTransaccional(req.body);

    // Emitir evento en tiempo real via Socket.io
    emitirEventoReserva('reserva:creada', nuevaReserva);

    // Enviar email de confirmación de forma asíncrona (fire-and-forget)
    const repoUsuario = AppDataSource.getRepository('Usuario');
    const repoSede = AppDataSource.getRepository('Sede');

    Promise.all([
      repoUsuario.findOne({ where: { id: nuevaReserva.estudiante_id } }),
      repoSede.findOne({ where: { id: nuevaReserva.sede_id } }),
      nuevaReserva.tipo_clase_id
        ? AppDataSource.getRepository('TipoClase').findOne({ where: { id: nuevaReserva.tipo_clase_id } })
        : Promise.resolve(null),
    ])
      .then(([est, sede, tipoClase]) => {
        if (est && est.email) {
          enviarConfirmacion(nuevaReserva, est.email, sede, tipoClase);
        }
      })
      .catch(() => {});

    res.status(201).json({
      mensaje: 'Reserva creada exitosamente',
      data: nuevaReserva
    });
  } catch (error) {
    console.error('Error en controlador de reservas:', error.message);
    const statusCode = error.status || 500;
    const response = { error: error.message || 'Error interno del servidor' };

    res.status(statusCode).json(response);
  }
};

// obtener reservas para calendario (usa req.validatedQuery del middleware Joi)
const obtenerReservas = async (req, res) => {
  try {
    const { fi, ff, s, i, v, e } = req.validatedQuery || req.query;

    const reservas = await reservasService.obtenerReservas({
      fechaInicio: fi ? (fi instanceof Date ? fi.toISOString() : (fi.includes('T') ? fi : `${fi}T00:00:00.000Z`)) : undefined,
      fechaFin: ff ? (ff instanceof Date ? ff.toISOString() : (ff.includes('T') ? ff : `${ff}T23:59:59.999Z`)) : undefined,
      sedeId: s,
      instructorId: i,
      vehiculoId: v,
      estudianteId: e,
    });
    res.json(reservas);
  } catch (error) {
    console.error('Error en obtenerReservas:', error.message);
    res.status(500).json({ error: 'Error al obtener las reservas' });
  }
};

// obtener horarios ocupados (para disponibilidad)
const obtenerHorariosOcupados = async (req, res) => {
  try {
    let { vi, fi, ff, si, ii } = req.query;
    const vehiculoId = vi;
    const fechaInicio = fi;
    const fechaFin = ff;
    const sedeId = si;
    const instructorId = ii;

    const ocupados = await reservasService.obtenerHorariosOcupados({
      fechaInicio, fechaFin, sedeId, instructorId, vehiculoId
    });
    res.json(ocupados);
  } catch (error) {
    console.error('Error en obtenerHorariosOcupados:', error.message);
    res.status(500).json({ error: 'Error al obtener horarios ocupados' });
  }
};

// suspender reservas futuras de un vehículo (contingencia)
const suspenderReservasVehiculo = async (req, res) => {
  try {
    const vehiculoId = parseInt(req.params.vehiculoId, 10);

    if (!vehiculoId || vehiculoId <= 0) {
      return res.status(400).json({ error: 'vehiculoId debe ser un número entero positivo' });
    }

    const afectadas = await reservasService.suspenderReservasVehiculo(vehiculoId);

    res.json({
      mensaje: `Se suspendieron ${afectadas} reserva(s) del vehículo #${vehiculoId}`,
      afectadas,
    });
  } catch (error) {
    console.error('Error en suspenderReservasVehiculo:', error.message);
    res.status(500).json({ error: 'Error al suspender las reservas del vehículo' });
  }
};

// obtener todos los tipos de clase disponibles
const obtenerTiposClase = async (req, res) => {
  try { 
    const repo = AppDataSource.getRepository('TipoClase');
    const tipos = await repo.find({ order: { id: 'ASC' } });
    res.json(tipos);
  } catch (error) {
    console.error('Error en obtenerTiposClase:', error.message);
    res.status(500).json({ error: 'Error al obtener los tipos de clase' });
  }
};

// ── Endpoints de recursos para el selector de reservas ──

const obtenerSedes = async (_req, res) => {
  try {
    const repo = AppDataSource.getRepository('Sede');
    const sedes = await repo.find({ order: { id: 'ASC' } });
    res.json(sedes);
  } catch (error) {
    console.error('Error en obtenerSedes:', error.message);
    res.status(500).json({ error: 'Error al obtener sedes' });
  }
};

const obtenerEstudiantes = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const where = { rol: 'estudiante', estado: 'activo' };
    if (sedeId) where.sede_id = parseInt(sedeId, 10);
    const repo = AppDataSource.getRepository('Usuario');
    const estudiantes = await repo.find({ where, order: { nombre: 'ASC' } });
    res.json(estudiantes);
  } catch (error) {
    console.error('Error en obtenerEstudiantes:', error.message);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
};

const obtenerInstructores = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const where = { rol: 'instructor', estado: 'activo' };
    if (sedeId) where.sede_id = parseInt(sedeId, 10);
    const repo = AppDataSource.getRepository('Usuario');
    const instructores = await repo.find({ where, order: { nombre: 'ASC' } });
    res.json(instructores);
  } catch (error) {
    console.error('Error en obtenerInstructores:', error.message);
    res.status(500).json({ error: 'Error al obtener instructores' });
  }
};

const obtenerVehiculos = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const where = { estado: 'disponible' };
    if (sedeId) where.sede_id = parseInt(sedeId, 10);
    const repo = AppDataSource.getRepository('Vehiculo');
    const vehiculos = await repo.find({ where, order: { id: 'ASC' } });
    res.json(vehiculos);
  } catch (error) {
    console.error('Error en obtenerVehiculos:', error.message);
    res.status(500).json({ error: 'Error al obtener vehículos' });
  }
};

module.exports = {
  crearReserva, obtenerReservas, obtenerHorariosOcupados, suspenderReservasVehiculo,
  obtenerTiposClase, obtenerSedes, obtenerEstudiantes, obtenerInstructores, obtenerVehiculos,
};