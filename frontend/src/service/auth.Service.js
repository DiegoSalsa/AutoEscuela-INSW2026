const BASE_API = import.meta.env.VITE_BASE_URL 
  ? import.meta.env.VITE_BASE_URL.replace(/\/$/, '') + '/api/auth'
  : '/api/auth';

const parseResponseSafely = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('Cannot GET') || text.includes('Cannot POST')) {
      throw new Error('El servidor aún no reconoce las rutas de login. Por favor guarda/acepta los cambios en los archivos del backend en tu editor para que el servidor (nodemon) se actualice.');
    }
    throw new Error('Error de comunicación con el servidor: ' + text.slice(0, 100));
  }
};

export const login = async (email, password) => {
  const response = await fetch(`${BASE_API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseResponseSafely(response);
  if (!response.ok) {
    throw new Error(data.error || 'Error al iniciar sesión');
  }
  if (data.token) {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  }
  return data;
};

export const getSession = () => {
  try {
    const userStr = localStorage.getItem('auth_user');
    const token = localStorage.getItem('auth_token');
    if (userStr && token) {
      return JSON.parse(userStr);
    }
  } catch (e) {
    console.error('Error restaurando sesión:', e);
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};
