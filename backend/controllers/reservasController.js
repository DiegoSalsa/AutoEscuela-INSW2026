const reservasService = require('../services/reservasService');

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

module.exports = { crearReserva };
