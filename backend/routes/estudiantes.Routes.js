const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/estudiantes.Controller');
const { validarSedeId, validarEstudianteId, validarCrearEstudiante } = require('../validations/estudiantes.Validations');

// POST /api/estudiantes - crear estudiante
router.post('/', validarCrearEstudiante, ctrl.crearEstudiante);

// GET /api/estudiantes busqueda global
router.get('/', validarSedeId, ctrl.buscarEstudiantes);

// GET /api/estudiantes/:id  perfil estudiante
router.get('/:id', validarEstudianteId, ctrl.getPerfilEstudiante);

module.exports = router;
