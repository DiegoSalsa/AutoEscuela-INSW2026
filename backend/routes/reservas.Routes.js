const { Router } = require('express');
const router = Router();
const controller = require('../controllers/reservas.Controller');
const validation = require('../validations/reservas.Validations');
const { idempotency } = require('../middleware/idempotency.middleware');

// POST con idempotencia + validación Joi
router.post('/', idempotency, validation.validarCreacionReserva, controller.crearReserva);
router.get('/ocupados', controller.obtenerHorariosOcupados);
router.get('/', validation.validarFiltrosCalendario, controller.obtenerReservas);

// PATCH — Contingencia: suspender reservas futuras de un vehículo
router.patch('/vehiculo/:vehiculoId/suspender', controller.suspenderReservasVehiculo);

module.exports = router;