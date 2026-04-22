const validarCreacionReserva = (req, res, next) => {
  const { estudianteId, instructorId, vehiculoId, sedeId, fechaInicio, fechaFin } = req.body;

  
  // 1. Validación de campos obligatorios
  if (!estudianteId || !instructorId || !vehiculoId || !sedeId || !fechaInicio || !fechaFin) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios. Asegúrese de enviar estudianteId, instructorId, vehiculoId, sedeId, fechaInicio y fechaFin.' 
    });
  }

  // 2. Validación de tipos: todos los IDs deben ser enteros positivos
  const ids = { estudianteId, instructorId, vehiculoId, sedeId };
  for (const [campo, valor] of Object.entries(ids)) {
    const num = Number(valor);
    if (!Number.isInteger(num) || num <= 0) {
      return res.status(400).json({
        error: `El campo '${campo}' debe ser un entero positivo. Se recibió: ${valor}`
      });
    }
  }

  // 3. Castear los IDs a enteros (por si vienen como strings del frontend)
  req.body.estudianteId = Number(estudianteId);
  req.body.instructorId = Number(instructorId);
  req.body.vehiculoId = Number(vehiculoId);
  req.body.sedeId = Number(sedeId);

  // 4. Validación de fechas: formato válido
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return res.status(400).json({
      error: 'Las fechas proporcionadas no tienen un formato válido (ISO 8601).'
    });
  }

  // 5. Fecha de inicio debe ser en el futuro
  if (inicio < new Date()) {
    return res.status(400).json({
      error: 'No se pueden crear reservas en fechas pasadas.'
    });
  }

  // 6. Fecha de inicio debe ser anterior a fecha de fin
  if (inicio >= fin) {
    return res.status(400).json({ 
      error: 'Inconsistencia temporal: La fecha de inicio debe ser anterior a la fecha de fin.' 
    });
  }



  next();
};

const validarFiltrosCalendario = (req, res, next) => {
  const { fechaInicio, fechaFin } = req.query;
  if (fechaInicio && isNaN(new Date(fechaInicio))) {
    return res.status(400).json({ error: 'fechaInicio no es válida' });
  }
  if (fechaFin && isNaN(new Date(fechaFin))) {
    return res.status(400).json({ error: 'fechaFin no es válida' });
  }
  next();
};

module.exports = { validarCreacionReserva, validarFiltrosCalendario };