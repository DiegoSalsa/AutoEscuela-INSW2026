const API_URL = import.meta.env.VITE_BASE_URL
  ? import.meta.env.VITE_BASE_URL.replace(/\/$/, '') + '/api'
  : '/api';

export async function subirImagenVehiculo(vehiculoId, imagen) {
  const formData = new FormData();
  formData.append('imagen', imagen);

  const response = await fetch(`${API_URL}/dashboard/vehiculos/${vehiculoId}/imagen`, {
    method: 'POST',
    body: formData,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) throw new Error(data.error || 'Error al subir la imagen');
  return data.vehiculo;
}
