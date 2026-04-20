const reservasService = require('../services/reservasService');

const crearReserva = async (req, res) => {
  try {
    // El body ya viene limpio y validado gracias a nuestro Validator (siguiente paso)
    const nuevaReserva = await reservasService.crearReservaTransaccional(req.body);
    
    res.status(201).json({
      mensaje: 'Reserva creada exitosamente',
      data: nuevaReserva
    });

  } catch (error) {
    console.error('Error en controlador de reservas:', error.message);
    
    // Si el error trae un status (ej. nuestro 409 de solapamiento), lo usamos.
    // Si no, es un error 500 del servidor.
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message || 'Error interno del servidor' });
  }
};

module.exports = { crearReserva };