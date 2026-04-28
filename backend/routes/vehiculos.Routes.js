const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/vehiculos.Controller');
const { validarUpdateEstado } = require('../validations/vehiculos.Validations');

router.get('/', ctrl.getFlota);
// Endpoint para actualizar el estado del vehiculo
router.put('/:id/estado', validarUpdateEstado, ctrl.updateEstadoVehiculo);

module.exports = router;