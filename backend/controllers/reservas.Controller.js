const reservasService = require('../services/reservas.Service');
const { emitirEventoReserva } = require('../services/socket');
const { enviarConfirmacion, enviarModificacion, enviarCancelacion } = require('../services/notificaciones.Service');
const { AppDataSource } = require('../db/data-source');

const crearReserva = async (req, res) => {
  try {
    const nuevaReserva = await reservasService.crearReservaTransaccional(req.body);

    // Notificar por WebSocket
    emitirEventoReserva('reserva:creada', nuevaReserva);

    // Enviar email de confirmación
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

// Obtener lista de reservas
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

// Obtener horarios ocupados
const obtenerHorariosOcupados = async (req, res) => {
  try {
    let { vi, fi, ff, si, ii, ei } = req.query;
    const vehiculoId = vi;
    const fechaInicio = fi;
    const fechaFin = ff;
    const sedeId = si;
    const instructorId = ii;
    const estudianteId = ei;

    const ocupados = await reservasService.obtenerHorariosOcupados({
      fechaInicio, fechaFin, sedeId, instructorId, vehiculoId, estudianteId
    });
    res.json(ocupados);
  } catch (error) {
    console.error('Error en obtenerHorariosOcupados:', error.message);
    res.status(500).json({ error: 'Error al obtener horarios ocupados' });
  }
};

// Suspender reservas de un vehículo
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


// GET /reservas/:id — obtener una reserva por ID
const obtenerReservaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = await reservasService.obtenerReservaPorId(parseInt(id, 10));
    res.json(reserva);
  } catch (error) {
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

// PUT /reservas/:id — actualizar reserva
const actualizarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    // El header x-rol lo envía el frontend según el usuario fantasma seleccionado
    const esAdmin = req.headers['x-rol'] === 'admin';
    const reserva = await reservasService.actualizarReservaTransaccional(
      parseInt(id, 10),
      req.body,
      esAdmin
    );
    emitirEventoReserva('reserva:actualizada', reserva);

    // Correo de modificación (fire-and-forget)
    const repoUsuario = AppDataSource.getRepository('Usuario');
    const repoSede = AppDataSource.getRepository('Sede');
    Promise.all([
      repoUsuario.findOne({ where: { id: reserva.estudiante_id } }),
      repoSede.findOne({ where: { id: reserva.sede_id } }),
      reserva.tipo_clase_id
        ? AppDataSource.getRepository('TipoClase').findOne({ where: { id: reserva.tipo_clase_id } })
        : Promise.resolve(null),
    ])
      .then(([est, sede, tipoClase]) => {
        if (est && est.email) enviarModificacion(reserva, est.email, sede, tipoClase);
      })
      .catch(() => {});

    res.json({ mensaje: 'Reserva actualizada exitosamente', data: reserva });
  } catch (error) {
    console.error('Error en actualizarReserva:', error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

// DELETE /reservas/:id — cancelar reserva
const cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const esAdmin = req.headers['x-rol'] === 'admin';
    const reserva = await reservasService.cancelarReserva(parseInt(id, 10), esAdmin);
    emitirEventoReserva('reserva:cancelada', reserva);

    // Correo de cancelación (fire-and-forget)
    const repoUsuario = AppDataSource.getRepository('Usuario');
    const repoSede = AppDataSource.getRepository('Sede');
    Promise.all([
      repoUsuario.findOne({ where: { id: reserva.estudiante_id } }),
      repoSede.findOne({ where: { id: reserva.sede_id } }),
    ])
      .then(([est, sede]) => {
        if (est && est.email) enviarCancelacion(reserva, est.email, sede);
      })
      .catch(() => {});

    res.json({ mensaje: 'Reserva cancelada exitosamente', data: reserva });
  } catch (error) {
    console.error('Error en cancelarReserva:', error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

module.exports = {
  crearReserva, obtenerReservas, obtenerHorariosOcupados, suspenderReservasVehiculo,
  obtenerTiposClase, obtenerSedes, obtenerEstudiantes, obtenerInstructores, obtenerVehiculos,
  obtenerReservaPorId, actualizarReserva, cancelarReserva,
};