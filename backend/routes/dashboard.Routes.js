const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/dashboard.Controller');
const validation = require('../validations/dashboard.Validations');

router.get('/kpis', validation.validarSedeId, ctrl.getKPIs);
router.get('/clases-hoy', validation.validarClasesHoy, ctrl.getClasesHoy);
router.get('/grafico-semana', validation.validarGraficoSemana, ctrl.getGraficoSemana);
router.get('/uso-flota', validation.validarSedeId, ctrl.getUsoFlota);

module.exports = router;
