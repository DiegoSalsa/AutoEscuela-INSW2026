const reservasService = require('../services/reservas.Service');

const crearReserva = async (req, res) => {
  try {
    const nuevaReserva = await reservasService.crearReservaTransaccional(req.body);
    res.status(201).json({
      mensaje: 'Reserva creada exitosamente',
      data: nuevaReserva
    });
  } catch (error) {
    console.error('Error en controlador de reservas:', error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message || 'Error interno del servidor' });
  }
};

// obtener reservas para calendario
const obtenerReservas = async (req, res) => {
  try {
    let { fi, ff, s, i, v, e } = req.query;

    // convertir fechas cortas a ISO
    if (fi && !fi.includes('T')) fi = `${fi}T00:00:00.000Z`;
    if (ff && !ff.includes('T')) ff = `${ff}T23:59:59.999Z`;

    const reservas = await reservasService.obtenerReservas({
      fechaInicio: fi,
      fechaFin: ff,
      sedeId: s,
      instructorId: i,
      vehiculoId: v,
      estudianteId: e
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

module.exports = { crearReserva, obtenerReservas, obtenerHorariosOcupados };