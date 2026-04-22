const { Router } = require('express');
const router = Router();
const controller = require('../controllers/reservasController');
const validation = require('../validations/reservasValidations');


router.post('/', validation.validarCreacionReserva, controller.crearReserva);

module.exports = router;
