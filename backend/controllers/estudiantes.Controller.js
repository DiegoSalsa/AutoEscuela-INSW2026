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
    const perfil = await estudiantesService.getPerfilEstudiante(id);
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

module.exports = { crearEstudiante, getPerfilEstudiante, buscarEstudiantes };
