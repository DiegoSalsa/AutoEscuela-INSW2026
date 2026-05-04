const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/vehiculos.Controller');
const { validarUpdateEstado } = require('../validations/vehiculos.Validations');

router.get('/', ctrl.getFlota);
// Endpoint para actualizar el estado del vehiculo
router.put('/:id/estado', validarUpdateEstado, ctrl.updateEstadoVehiculo);
//endpoint para registrar el final de una sesion de conduccion
router.post('/:id/finalizar-sesion', ctrl.registrarFinDeSesion);

module.exports = router;