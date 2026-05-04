// middleware que valida req.query.sedeId 
const validarSedeId = (req, res, next) => {
  const { sedeId } = req.query;

  if (sedeId === undefined || sedeId === '') {
    return next();
  }

  const parsed = Number(sedeId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return res.status(400).json({
      error: 'El ID de la sede debe ser un número entero válido'
    });
  }

  req.query.sedeId = parsed;
  next();
};

// middleware que valida el body para crear estudiante
const validarCrearEstudiante = (req, res, next) => {
  const { nombre, email, telefono, rut, sedeId } = req.body;

  // validar campos obligatorios
  if (!nombre || !email || !rut || !sedeId) {
    return res.status(400).json({
      error: 'Los campos nombre, email, rut y sedeId son obligatorios'
    });
  }

  // validar que nombre sea string
  if (typeof nombre !== 'string' || nombre.trim().length < 3) {
    return res.status(400).json({
      error: 'El nombre debe tener al menos 3 caracteres'
    });
  }

  // validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'El email no es válido'
    });
  }

  // validar rut
  const rutRegex = /^[0-9]{7,8}(-?[0-9K])?$/i;
  if (!rutRegex.test(rut)) {
    return res.status(400).json({
      error: 'El RUT debe tener formato válido (ej: 12345678-9 o 12345678)'
    });
  }

  // validar telefono si viene
  if (telefono && typeof telefono !== 'string') {
    return res.status(400).json({
      error: 'El teléfono debe ser texto'
    });
  }

  // validar sedeId
  const parsedSedeId = Number(sedeId);
  if (!Number.isInteger(parsedSedeId) || parsedSedeId <= 0) {
    return res.status(400).json({
      error: 'El ID de la sede debe ser un número entero válido'
    });
  }

  req.body.email = email.toLowerCase().trim();
  req.body.rut = rut.toUpperCase().trim();
  req.body.nombre = nombre.trim();
  req.body.sedeId = parsedSedeId;

  next();
};

// middleware que valida req.params.id 
const validarEstudianteId = (req, res, next) => {
  const { id } = req.params;

  const parsed = Number(id);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return res.status(400).json({
      error: 'El ID del estudiante debe ser un número entero válido'
    });
  }

  req.params.id = parsed;
  next();
};

// middleware que valida moduloId en params
const validarModuloId = (req, res, next) => {
  const { moduloId } = req.params;

  const parsed = Number(moduloId);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return res.status(400).json({
      error: 'El ID del módulo debe ser un número entero válido'
    });
  }

  req.params.moduloId = parsed;
  next();
};

// middleware que valida actualización de estudiante
const validarActualizarEstudiante = (req, res, next) => {
  const { nombre, email, telefono } = req.body;

  // al menos uno debe venir
  if (!nombre && !email && !telefono) {
    return res.status(400).json({
      error: 'Debes proporcionar al menos un campo para actualizar (nombre, email o telefono)'
    });
  }

  // validar nombre si viene
  if (nombre && (typeof nombre !== 'string' || nombre.trim().length < 3)) {
    return res.status(400).json({
      error: 'El nombre debe tener al menos 3 caracteres'
    });
  }

  // validar email si viene
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'El email no es válido'
      });
    }
    req.body.email = email.toLowerCase().trim();
  }

  // validar telefono si viene
  if (telefono && typeof telefono !== 'string') {
    return res.status(400).json({
      error: 'El teléfono debe ser texto'
    });
  }

  if (nombre) req.body.nombre = nombre.trim();
  if (telefono) req.body.telefono = telefono.trim();

  next();
};

// middleware que valida actualización de progreso de módulo
const validarActualizarProgreso = (req, res, next) => {
  const { aprobado, calificacion } = req.body;

  // al menos uno debe venir
  if (aprobado === undefined && calificacion === undefined) {
    return res.status(400).json({
      error: 'Debes proporcionar al menos un campo para actualizar (aprobado o calificacion)'
    });
  }

  // validar aprobado si viene
  if (aprobado !== undefined && typeof aprobado !== 'boolean') {
    return res.status(400).json({
      error: 'El campo aprobado debe ser verdadero o falso'
    });
  }

  // validar calificación si viene
  if (calificacion !== undefined) {
    const cal = parseInt(calificacion, 10);
    if (isNaN(cal) || cal < 0 || cal > 100) {
      return res.status(400).json({
        error: 'La calificación debe ser un número entre 0 y 100'
      });
    }
    req.body.calificacion = cal;
  }

  next();
};

module.exports = { validarSedeId, validarEstudianteId, validarCrearEstudiante, validarModuloId, validarActualizarEstudiante, validarActualizarProgreso };
