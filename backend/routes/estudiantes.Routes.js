const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/estudiantes.Controller');
const { validarSedeId, validarEstudianteId, validarCrearEstudiante, validarModuloId, validarActualizarEstudiante, validarActualizarProgreso } = require('../validations/estudiantes.Validations');

// POST /api/estudiantes - crear estudiante
router.post('/', validarCrearEstudiante, ctrl.crearEstudiante);

// GET /api/estudiantes - buscador global
router.get('/', validarSedeId, ctrl.buscarEstudiantes);

// GET /api/modulos - obtener todos los módulos teóricos
router.get('/teoria/modulos', ctrl.getModulosTeoricos);

// GET /api/estudiantes/:id/modulos - obtener modulos del estudiante
router.get('/:id/modulos', validarEstudianteId, ctrl.getModulosEstudiante);

// POST /api/estudiantes/:id/modulos/:moduloId - asignar módulo a estudiante
router.post('/:id/modulos/:moduloId', validarEstudianteId, validarModuloId, ctrl.asignarModuloEstudiante);

// PUT /api/estudiantes/:id/modulos/:moduloId - actualizar progreso del módulo
router.put('/:id/modulos/:moduloId', validarEstudianteId, validarModuloId, validarActualizarProgreso, ctrl.actualizarProgresoModulo);

// GET /api/estudiantes/:id/timeline - obtener timeline del estudiante
router.get('/:id/timeline', validarEstudianteId, ctrl.getTimelineEstudiante);

// PUT /api/estudiantes/:id - actualizar datos del estudiante
router.put('/:id', validarEstudianteId, validarActualizarEstudiante, ctrl.actualizarEstudiante);

// GET /api/estudiantes/:id - perfil estudiante (debe ir al final)
router.get('/:id', validarEstudianteId, ctrl.getPerfilEstudiante);

module.exports = router;
