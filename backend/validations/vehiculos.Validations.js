const Joi = require('joi');

// Esquema para validar el estado del vehiculo
const updateEstadoSchema = Joi.object({
  estado: Joi.string().valid('disponible', 'mantenimiento', 'en_sesion').required()
    .messages({
      'any.only': 'El estado debe ser: disponible, mantenimiento o en_sesion',
      'any.required': 'El campo estado es obligatorio'
    })
});

// Middleware para validar el estado del vehiculo
const validarUpdateEstado = (req, res, next) => {
  const { error } = updateEstadoSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { validarUpdateEstado };