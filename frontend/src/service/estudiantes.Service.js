const API_URL = import.meta.env.VITE_BASE_URL
  ? import.meta.env.VITE_BASE_URL.replace(/\/$/, '') + '/api'
  : '/api';

export async function buscarEstudiantes(sedeId = null, q = '') {
  const params = new URLSearchParams();
  if (sedeId) params.set('sedeId', sedeId);
  if (q) params.set('q', q);
  const qs = params.toString();
  const response = await fetch(`${API_URL}/estudiantes${qs ? `?${qs}` : ''}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al obtener estudiantes');
  return data;
}
