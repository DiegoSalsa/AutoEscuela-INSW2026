const Joi = require('joi');

const crearReservaSchema = Joi.object({
  estudianteId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'estudianteId debe ser un número',
      'number.integer': 'estudianteId debe ser un entero',
      'number.positive': 'estudianteId debe ser positivo',
      'any.required': 'estudianteId es obligatorio'
    }),
  instructorId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'instructorId debe ser un número',
      'number.integer': 'instructorId debe ser un entero',
      'number.positive': 'instructorId debe ser positivo',
      'any.required': 'instructorId es obligatorio'
    }),
  vehiculoId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'vehiculoId debe ser un número',
      'number.integer': 'vehiculoId debe ser un entero',
      'number.positive': 'vehiculoId debe ser positivo',
      'any.required': 'vehiculoId es obligatorio'
    }),
  sedeId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'sedeId debe ser un número',
      'number.integer': 'sedeId debe ser un entero',
      'number.positive': 'sedeId debe ser positivo',
      'any.required': 'sedeId es obligatorio'
    }),
  fechaInicio: Joi.date().iso().greater('now').required()
    .messages({
      'date.base': 'fechaInicio debe ser una fecha válida',
      'date.iso': 'fechaInicio debe usar formato ISO 8601',
      'date.greater': 'fechaInicio debe ser futura',
      'any.required': 'fechaInicio es obligatorio'
    }),
  fechaFin: Joi.date().iso().greater(Joi.ref('fechaInicio')).required()
    .messages({
      'date.base': 'fechaFin debe ser una fecha válida',
      'date.iso': 'fechaFin debe usar formato ISO 8601',
      'date.greater': 'fechaFin debe ser mayor que fechaInicio',
      'any.required': 'fechaFin es obligatorio'
    })
});

// para validar creacion de reserva
const validarCreacionReserva = (req, res, next) => {
  const { error, value } = crearReservaSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const mensajes = error.details.map(detail => detail.message);
    return res.status(400).json({ error: mensajes });
  }
  // Reemplazar los valores originales con los parseados (por si Joi los cambio a numero o fecha)
  req.body = value;
  next();
};

// Esquema para validar filtros del calendario
const filtrosCalendarioSchema = Joi.object({
  fi: Joi.date().iso().optional(),      // fechaInicio corta
  ff: Joi.date().iso().optional(),      // fechaFin corta
  s: Joi.number().integer().positive().optional(),   // sedeId
  i: Joi.number().integer().positive().optional(),   // instructorId
  v: Joi.number().integer().positive().optional(),   // vehiculoId
  e: Joi.number().integer().positive().optional()    // estudianteId
}).custom((value, helpers) => {
  if (value.fi && value.ff && new Date(value.fi) > new Date(value.ff)) {
    return helpers.error('date.greater', { message: 'fi no puede ser mayor que ff' });
  }
  return value;
}).messages({
  'date.iso': 'El parámetro debe ser una fecha ISO 8601',
  'number.base': 'El parámetro debe ser un número',
  'number.integer': 'El parámetro debe ser un entero',
  'number.positive': 'El parámetro debe ser positivo',
  'date.greater': 'fi no puede ser mayor que ff'
});

const validarFiltrosCalendario = (req, res, next) => {
  const { error, value } = filtrosCalendarioSchema.validate(req.query, { abortEarly: false });
  if (error) {
    const mensajes = error.details.map(detail => detail.message);
    return res.status(400).json({ error: mensajes });
  }

  req.validatedQuery = value;
  next();
};

module.exports = { validarCreacionReserva, validarFiltrosCalendario };