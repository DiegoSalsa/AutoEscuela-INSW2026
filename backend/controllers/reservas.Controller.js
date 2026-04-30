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
    repoUsuario.findOne({ where: { id: nuevaReserva.estudiante_id } })
      .then((est) => {
        if (est && est.email) {
          enviarConfirmacion(nuevaReserva, est.email);
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

module.exports = { crearReserva, obtenerReservas, obtenerHorariosOcupados, suspenderReservasVehiculo };