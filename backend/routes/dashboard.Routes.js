const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/dashboard.Controller');
const { validarSedeId } = require('../validations/dashboard.Validations');
const { uploadImagen } = require('../middleware/upload.middleware');

const procesarImagenVehiculo = (req, res, next) => {
  uploadImagen.single('imagen')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message || 'No se pudo procesar la imagen' });
    }
    next();
  });
};

// ── Endpoints analiticos ──
router.get('/kpis',              validarSedeId, ctrl.getKPIs);
router.get('/clases-hoy',        validarSedeId, ctrl.getClasesHoy);
router.get('/clases-proximas',   validarSedeId, ctrl.getClasesProximas);
router.get('/vehiculos',         validarSedeId, ctrl.getVehiculos);
router.post('/vehiculos/:id/imagen', procesarImagenVehiculo, ctrl.uploadImagenVehiculo);
router.get('/grafico-semana',    validarSedeId, ctrl.getGraficoSemana);
router.get('/uso-flota',         validarSedeId, ctrl.getUsoFlota);
router.get('/aprobados-reprobados', validarSedeId, ctrl.getAprobadosReprobados);
router.get('/ocupacion-sede',    validarSedeId, ctrl.getOcupacionSede);
router.get('/rendimiento-mes',   validarSedeId, ctrl.getRendimientoMes);
router.post('/reporte-avanzado', ctrl.generarReporte);

// ── CRUD Metas KPI ──
router.post('/metas',      ctrl.crearMeta);
router.get('/metas',        ctrl.obtenerMetas);
router.put('/metas/:id',    ctrl.actualizarMeta);
router.delete('/metas/:id', ctrl.eliminarMeta);

module.exports = router;
