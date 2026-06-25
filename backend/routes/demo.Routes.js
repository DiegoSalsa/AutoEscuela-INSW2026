const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/demo.Controller');

router.post('/academico/seed', ctrl.seedAcademico);
router.post('/flota/seed', ctrl.seedFlota);
router.post('/instructores/seed', ctrl.seedInstructores);

module.exports = router;
