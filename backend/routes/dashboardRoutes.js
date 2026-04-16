const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/dashboardController');

router.get('/kpis', ctrl.getKPIs);
router.get('/clases-hoy', ctrl.getClasesHoy);
router.get('/grafico-semana', ctrl.getGraficoSemana);
router.get('/uso-flota', ctrl.getUsoFlota);

module.exports = router;
