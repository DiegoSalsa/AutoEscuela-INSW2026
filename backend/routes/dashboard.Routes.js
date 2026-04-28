const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/dashboard.Controller');
const { validarSedeId } = require('../validations/dashboard.Validations');

// ── Endpoints analiticos (existentes) ──
router.get('/kpis',            validarSedeId, ctrl.getKPIs);
router.get('/clases-hoy',      validarSedeId, ctrl.getClasesHoy);
router.get('/grafico-semana',  validarSedeId, ctrl.getGraficoSemana);
router.get('/uso-flota',       validarSedeId, ctrl.getUsoFlota);
router.post('/reporte-avanzado', ctrl.generarReporte);

// ── CRUD Metas KPI (nuevo) ──
router.post('/metas',      ctrl.crearMeta);
router.get('/metas',        ctrl.obtenerMetas);
router.put('/metas/:id',    ctrl.actualizarMeta);
router.delete('/metas/:id', ctrl.eliminarMeta);

module.exports = router;
