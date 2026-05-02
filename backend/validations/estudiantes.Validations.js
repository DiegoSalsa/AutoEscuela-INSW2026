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

module.exports = { validarSedeId, validarEstudianteId, validarCrearEstudiante };
