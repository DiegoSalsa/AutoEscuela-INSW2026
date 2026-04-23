const Joi = require('joi');

// ─── Esquema base: sedeId opcional, entero positivo ───
const sedeIdSchema = Joi.object({
  sedeId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'sedeId debe ser un número',
      'number.integer': 'sedeId debe ser un entero',
      'number.positive': 'sedeId debe ser positivo'
    })
});

// ─── Esquema para clases-hoy: sedeId + fecha ───
const clasesHoySchema = Joi.object({
  sedeId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'sedeId debe ser un número',
      'number.integer': 'sedeId debe ser un entero',
      'number.positive': 'sedeId debe ser positivo'
    }),
  fecha: Joi.date().iso().optional()
    .messages({
      'date.base': 'fecha debe ser una fecha válida',
      'date.format': 'fecha debe usar formato ISO (YYYY-MM-DD)'
    })
});

// ─── Esquema para gráfico-semana: sedeId + dias dinámico ───
const graficoSemanaSchema = Joi.object({
  sedeId: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'sedeId debe ser un número',
      'number.integer': 'sedeId debe ser un entero',
      'number.positive': 'sedeId debe ser positivo'
    }),
  dias: Joi.number().integer().min(1).max(90).optional().default(7)
    .messages({
      'number.base': 'dias debe ser un número',
      'number.integer': 'dias debe ser un entero',
      'number.min': 'dias debe ser al menos 1',
      'number.max': 'dias no puede superar 90'
    })
});

// ─── Middlewares ───

const validarSedeId = (req, res, next) => {
  const { error, value } = sedeIdSchema.validate(req.query, { abortEarly: false });
  if (error) {
    const mensajes = error.details.map(d => d.message);
    return res.status(400).json({ error: mensajes });
  }
  req.query = value;
  next();
};

const validarClasesHoy = (req, res, next) => {
  const { error, value } = clasesHoySchema.validate(req.query, { abortEarly: false });
  if (error) {
    const mensajes = error.details.map(d => d.message);
    return res.status(400).json({ error: mensajes });
  }
  req.query = value;
  next();
};

const validarGraficoSemana = (req, res, next) => {
  const { error, value } = graficoSemanaSchema.validate(req.query, { abortEarly: false });
  if (error) {
    const mensajes = error.details.map(d => d.message);
    return res.status(400).json({ error: mensajes });
  }
  req.query = value;
  next();
};

module.exports = { validarSedeId, validarClasesHoy, validarGraficoSemana };
