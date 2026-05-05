const { Router } = require('express');
const router = Router();
const controller = require('../controllers/reservas.Controller');
const validation = require('../validations/reservas.Validations');
const { idempotency } = require('../middleware/idempotency.middleware');

// POST con idempotencia + validación Joi
router.post('/', idempotency, validation.validarCreacionReserva, controller.crearReserva);
router.get('/tipos-clase', controller.obtenerTiposClase);
router.get('/ocupados', controller.obtenerHorariosOcupados);
router.get('/', validation.validarFiltrosCalendario, controller.obtenerReservas);

// Recursos para el selector dinámico
router.get('/sedes', controller.obtenerSedes);
router.get('/estudiantes', controller.obtenerEstudiantes);
router.get('/instructores', controller.obtenerInstructores);
router.get('/vehiculos', controller.obtenerVehiculos);

// CRUD completo por ID
router.get('/:id', controller.obtenerReservaPorId);
router.put('/:id', controller.actualizarReserva);
router.delete('/:id', controller.cancelarReserva);

// PATCH — Contingencia: suspender reservas futuras de un vehículo
router.patch('/vehiculo/:vehiculoId/suspender', controller.suspenderReservasVehiculo);

module.exports = router;