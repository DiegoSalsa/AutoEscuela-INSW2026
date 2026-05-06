const estudiantesService = require('../services/estudiantes.Service');

// POST /api/estudiantes - crear estudiante
const crearEstudiante = async (req, res) => {
  try {
    const nuevoEstudiante = await estudiantesService.crearEstudiante(req.body);
    res.status(201).json({
      mensaje: 'Estudiante creado exitosamente',
      data: nuevoEstudiante
    });
  } catch (error) {
    console.error('Error en crearEstudiante:', error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message || 'Error al crear el estudiante' });
  }
};

// GET /api/estudiantes/:id perfil estudiante + hora practico
const getPerfilEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const estudianteId = parseInt(id, 10);
    const perfil = await estudiantesService.getPerfilEstudiante(estudianteId);
    res.json(perfil);
  } catch (error) {
    console.error('Error en getPerfilEstudiante:', error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message || 'Error al obtener el perfil del estudiante' });
  }
};

// GET /api/estudiantes?sedeId=&q=busqueda busqueda global de estudiante
const buscarEstudiantes = async (req, res) => {
  try {
    const { sedeId, q } = req.query;
    const resultados = await estudiantesService.buscarEstudiantes(sedeId, q);
    res.json(resultados);
  } catch (error) {
    console.error('Error en buscarEstudiantes:', error.message);
    res.status(500).json({ error: 'Error al buscar estudiantes' });
  }
};

// GET /api/estudiantes/:id/modulos - obtener modulos del estudiante
const getModulosEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const estudianteId = parseInt(id, 10);
    const modulos = await estudiantesService.getModulosEstudiante(estudianteId);
    res.json(modulos);
  } catch (error) {
    console.error('Error en getModulosEstudiante:', error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message || 'Error al obtener los módulos' });
  }
};

// GET /api/estudiantes/:id/timeline - obtener timeline del estudiante
const getTimelineEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const estudianteId = parseInt(id, 10);
    const timeline = await estudiantesService.getTimelineEstudiante(estudianteId);
    res.json(timeline);
  } catch (error) {
    console.error('Error en getTimelineEstudiante:', error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message || 'Error al obtener la timeline' });
  }
};

// PUT /api/estudiantes/:id - actualizar datos del estudiante
const actualizarEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const estudianteId = parseInt(id, 10);
    const actualizado = await estudiantesService.actualizarEstudiante(estudianteId, req.body);
    res.json(actualizado);
  } catch (error) {
    console.error('Error en actualizarEstudiante:', error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message || 'Error al actualizar el estudiante' });
  }
};

// GET /api/modulos - obtener todos los módulos teóricos
const getModulosTeoricos = async (req, res) => {
  try {
    const modulos = await estudiantesService.getModulosTeoricos();
    res.json(modulos);
  } catch (error) {
    console.error('Error en getModulosTeoricos:', error.message);
    res.status(500).json({ error: 'Error al obtener los módulos teóricos' });
  }
};

// POST /api/estudiantes/:id/modulos/:moduloId - asignar módulo a estudiante
const asignarModuloEstudiante = async (req, res) => {
  try {
    const { id, moduloId } = req.params;
    const estudianteId = parseInt(id, 10);
    const moduloIdNum = parseInt(moduloId, 10);
    const resultado = await estudiantesService.asignarModuloEstudiante(estudianteId, moduloIdNum);
    res.status(201).json(resultado);
  } catch (error) {
    console.error('Error en asignarModuloEstudiante:', error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message || 'Error al asignar el módulo' });
  }
};

// PUT /api/estudiantes/:id/modulos/:moduloId - actualizar progreso del módulo
const actualizarProgresoModulo = async (req, res) => {
  try {
    const { id, moduloId } = req.params;
    const estudianteId = parseInt(id, 10);
    const moduloIdNum = parseInt(moduloId, 10);
    const resultado = await estudiantesService.actualizarProgresoModulo(estudianteId, moduloIdNum, req.body);
    res.json(resultado);
  } catch (error) {
    console.error('Error en actualizarProgresoModulo:', error.message);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message || 'Error al actualizar el progreso' });
  }
};

module.exports = { crearEstudiante, getPerfilEstudiante, buscarEstudiantes, getModulosEstudiante, getTimelineEstudiante, actualizarEstudiante, getModulosTeoricos, asignarModuloEstudiante, actualizarProgresoModulo };
