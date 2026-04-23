const { Router } = require('express');
const router = Router();
const controller = require('../controllers/reservas.Controller');
const validation = require('../validations/reservas.Validations');

router.post('/', validation.validarCreacionReserva, controller.crearReserva);
router.get('/ocupados', controller.obtenerHorariosOcupados);   
router.get('/', validation.validarFiltrosCalendario, controller.obtenerReservas);

module.exports = router;