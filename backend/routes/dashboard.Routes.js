const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/dashboard.Controller');
const { validarSedeId } = require('../validations/dashboard.Validations');

router.get('/kpis', validarSedeId, ctrl.getKPIs);
router.get('/clases-hoy', validarSedeId, ctrl.getClasesHoy);
router.get('/grafico-semana', validarSedeId, ctrl.getGraficoSemana);
router.get('/uso-flota', validarSedeId, ctrl.getUsoFlota);

module.exports = router;
