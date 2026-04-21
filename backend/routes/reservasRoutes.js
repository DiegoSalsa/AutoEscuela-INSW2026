const { Router } = require('express');
const router = Router();
const controller = require('../controllers/reservasController');
const validation = require('../validations/reservasValidations');

// POST /api/reservas -> [Validador] -> [Controlador]
router.post('/', validation.validarCreacionReserva, controller.crearReserva);

module.exports = router;