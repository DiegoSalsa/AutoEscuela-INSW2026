const BASE_API = import.meta.env.VITE_BASE_URL 
  ? import.meta.env.VITE_BASE_URL.replace(/\/$/, '') + '/api/instructor'
  : '/api/instructor';
const API_URL = BASE_API;

export const getClasesHoy = async (instructorId, fecha = '') => {
  const url = fecha ? `${API_URL}/${instructorId}/clases-hoy?fecha=${fecha}` : `${API_URL}/${instructorId}/clases-hoy`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Error al obtener clases del día');
  return await response.json();
};

export const getEstudiantesInstructor = async (instructorId) => {
  const response = await fetch(`${API_URL}/${instructorId}/estudiantes`);
  if (!response.ok) throw new Error('Error al obtener estudiantes');
  return await response.json();
};

export const guardarEvaluacion = async (data) => {
  const response = await fetch(`${API_URL}/evaluacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al guardar la evaluación');
  return await response.json();
};

export const getEvaluacionesEstudiante = async (instructorId, estudianteId) => {
  const response = await fetch(`${API_URL}/${instructorId}/evaluaciones/${estudianteId}`);
  if (!response.ok) throw new Error('Error al obtener historial de evaluaciones');
  return await response.json();
};
