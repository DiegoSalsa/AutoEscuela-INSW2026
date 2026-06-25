const API_URL = (import.meta.env.VITE_BASE_URL || '').replace(/\/$/, '');
const DEMO_API_BASE = API_URL ? `${API_URL}/api/demo` : '/api/demo';

async function postSeed(url) {
  const response = await fetch(url, { method: 'POST' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'No se pudieron cargar los datos demo');
    error.status = response.status;
    throw error;
  }
  return data;
}

async function postDemoSeed(path) {
  return postSeed(`${DEMO_API_BASE}${path}`);
}

async function cargarInstructores() {
  try {
    return await postDemoSeed('/instructores/seed');
  } catch (error) {
    if (error.status !== 404) throw error;
    const data = await postDemoSeed('/flota/seed');
    return {
      mensaje: 'Datos demo de instructores cargados',
      creados: {
        instructores: data.creados?.instructoresApoyo || 'generados desde demo de flota',
        reservasSincronizadas: data.creados?.reservasSincronizadas || 0,
      },
    };
  }
}

export const demoService = {
  cargarAcademico: () => postDemoSeed('/academico/seed'),
  cargarFlota: () => postDemoSeed('/flota/seed'),
  cargarInstructores,
};
