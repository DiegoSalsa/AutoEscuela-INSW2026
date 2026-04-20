const validarCreacionReserva = (req, res, next) => {
  const { estudianteId, instructorId, vehiculoId, sedeId, fechaInicio, fechaFin } = req.body;

  // Validación básica: que no falte nada
  if (!estudianteId || !instructorId || !vehiculoId || !sedeId || !fechaInicio || !fechaFin) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios. Asegúrese de enviar estudianteId, instructorId, vehiculoId, sedeId, fechaInicio y fechaFin.' 
    });
  }

  // Validación de fechas lógicas
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (inicio >= fin) {
    return res.status(400).json({ 
      error: 'Inconsistencia temporal: La fecha de inicio debe ser anterior a la fecha de fin.' 
    });
  }

  // Si todo está bien, pasamos al controlador
  next();
};

module.exports = { validarCreacionReserva };