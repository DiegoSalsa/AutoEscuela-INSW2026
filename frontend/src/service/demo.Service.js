const API_BASE = import.meta.env.VITE_BASE_URL ? `${import.meta.env.VITE_BASE_URL}/api/demo` : '/api/demo';

async function postDemoSeed(path) {
  const response = await fetch(`${API_BASE}${path}`, { method: 'POST' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'No se pudieron cargar los datos demo');
  }
  return data;
}

export const demoService = {
  cargarAcademico: () => postDemoSeed('/academico/seed'),
  cargarFlota: () => postDemoSeed('/flota/seed'),
};
