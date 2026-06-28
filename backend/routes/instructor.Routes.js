const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/instructor.Controller');

// GET /api/instructor/:id/clases-hoy?fecha=YYYY-MM-DD
router.get('/:id/clases-hoy', ctrl.getClasesHoy);

// GET /api/instructor/:id/estudiantes
router.get('/:id/estudiantes', ctrl.getEstudiantes);

// POST /api/instructor/evaluacion
router.post('/evaluacion', ctrl.postEvaluacion);

// GET /api/instructor/:id/evaluaciones/:estudianteId
router.get('/:id/evaluaciones/:estudianteId', ctrl.getEvaluacionesEstudiante);

module.exports = router;
