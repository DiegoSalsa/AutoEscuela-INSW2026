const { Router } = require('express');
const router = Router();
const controller = require('../controllers/reservas.Controller');
const validation = require('../validations/reservas.Validations');
const { idempotency } = require('../middleware/idempotency.middleware');

// Todas las rutas SIN autenticación JWT
router.post('/', idempotency, validation.validarCreacionReserva, controller.crearReserva);
router.get('/tipos-clase', controller.obtenerTiposClase);
router.get('/ocupados', controller.obtenerHorariosOcupados);
router.get('/', validation.validarFiltrosCalendario, controller.obtenerReservas);
router.get('/sedes', controller.obtenerSedes);
router.get('/estudiantes', controller.obtenerEstudiantes);
router.get('/instructores', controller.obtenerInstructores);
router.get('/vehiculos', controller.obtenerVehiculos);
router.get('/:id', controller.obtenerReservaPorId);
router.put('/:id', controller.actualizarReserva);
router.delete('/:id', controller.cancelarReserva);
router.patch('/vehiculo/:vehiculoId/suspender', controller.suspenderReservasVehiculo);

module.exports = router;