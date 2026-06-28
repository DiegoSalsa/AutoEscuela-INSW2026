const instructorService = require('../services/instructor.Service');

const getClasesHoy = async (req, res) => {
  try {
    const parsed = parseInt(req.params.id, 10);
    const instructorId = (!isNaN(parsed) && Number.isInteger(parsed)) ? parsed : null;
    const { fecha } = req.query;
    const clases = await instructorService.obtenerClasesHoy(instructorId, fecha);
    res.json(clases);
  } catch (error) {
    console.error('Error en getClasesHoy:', error.message);
    res.status(500).json({ error: 'Error al obtener las clases del instructor' });
  }
};

const getEstudiantes = async (req, res) => {
  try {
    const parsed = parseInt(req.params.id, 10);
    const instructorId = (!isNaN(parsed) && Number.isInteger(parsed)) ? parsed : null;
    const estudiantes = await instructorService.obtenerEstudiantes(instructorId);
    res.json(estudiantes);
  } catch (error) {
    console.error('Error en getEstudiantes:', error.message);
    res.status(500).json({ error: 'Error al obtener los estudiantes del instructor' });
  }
};

const postEvaluacion = async (req, res) => {
  try {
    const evaluacion = await instructorService.guardarEvaluacion(req.body);
    res.status(201).json({ mensaje: 'Evaluación guardada exitosamente', data: evaluacion });
  } catch (error) {
    console.error('Error en postEvaluacion:', error.message);
    res.status(500).json({ error: 'Error al guardar la evaluación' });
  }
};

const getEvaluacionesEstudiante = async (req, res) => {
  try {
    const estudianteId = parseInt(req.params.estudianteId, 10);
    const evaluaciones = await instructorService.obtenerEvaluacionesEstudiante(estudianteId);
    res.json(evaluaciones);
  } catch (error) {
    console.error('Error en getEvaluacionesEstudiante:', error.message);
    res.status(500).json({ error: 'Error al obtener las evaluaciones del estudiante' });
  }
};

module.exports = {
  getClasesHoy,
  getEstudiantes,
  postEvaluacion,
  getEvaluacionesEstudiante,
};
