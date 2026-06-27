const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/vehiculos.Controller');
const { validarUpdateEstado } = require('../validations/vehiculos.Validations');
const { uploadImagen } = require('../middleware/upload.middleware');

const procesarImagenVehiculo = (req, res, next) => {
  uploadImagen.single('imagen')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message || 'No se pudo procesar la imagen' });
    }
    next();
  });
};

router.get('/', ctrl.getFlota);
// Endpoint para actualizar el estado del vehiculo
router.put('/:id/estado', validarUpdateEstado, ctrl.updateEstadoVehiculo);
router.post('/:id/imagen', procesarImagenVehiculo, ctrl.uploadImagenVehiculo);
//endpoint para registrar el final de una sesion de conduccion
router.post('/:id/finalizar-sesion', ctrl.registrarFinDeSesion);

module.exports = router;
