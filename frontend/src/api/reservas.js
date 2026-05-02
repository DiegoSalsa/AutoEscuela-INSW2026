// src/api/reservas.js
const API_URL = 'http://localhost:3000/api';

// Helper genérico para hacer peticiones al backend
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.mensaje || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error(`Error fetchAPI [${endpoint}]:`, error);
    throw error;
  }
}

//Obtener las reservas ocupadas para un día y recursos específicos
export async function getHorariosOcupados(fecha, sedeId, instructorId, vehiculoId) {
  // Aseguramos formato YYYY-MM-DD
  const isoDate = typeof fecha === 'string' ? fecha.split('T')[0] : fecha.toISOString().split('T')[0];
  
  const query = new URLSearchParams({
    fi: isoDate,
    ff: isoDate,
    si: sedeId,
  });

  if (instructorId) query.append('ii', instructorId);
  if (vehiculoId) query.append('vi', vehiculoId);

  return fetchAPI(`/reservas/ocupados?${query.toString()}`);
}

// Obtener los tipos de clase disponibles
export async function getTiposClase() {
  return fetchAPI('/reservas/tipos-clase');
}

// Crear una nueva reserva con llave de idempotencia
export async function crearReserva(reservaData, idempotencyKey) {
  // Usar la key proporcionada o generar una nueva como fallback
  const key = idempotencyKey || crypto.randomUUID();

  return fetchAPI('/reservas', {
    method: 'POST',
    headers: {
      'Idempotency-Key': key,
    },
    body: JSON.stringify(reservaData),
  });
}

// ── Recursos para el selector dinámico ──

export async function getSedes() {
  return fetchAPI('/reservas/sedes');
}

export async function getEstudiantes(sedeId) {
  const query = sedeId ? `?sedeId=${sedeId}` : '';
  return fetchAPI(`/reservas/estudiantes${query}`);
}

export async function getInstructores(sedeId) {
  const query = sedeId ? `?sedeId=${sedeId}` : '';
  return fetchAPI(`/reservas/instructores${query}`);
}

export async function getVehiculos(sedeId) {
  const query = sedeId ? `?sedeId=${sedeId}` : '';
  return fetchAPI(`/reservas/vehiculos${query}`);
}
