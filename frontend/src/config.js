// URL base del backend, calculada según cómo se accedió al front
// Si entras desde 192.168.1.42:5173, esto genera 192.168.1.42:3156 automáticamente
export const API_URL = `http://${window.location.hostname}:3156`

// Wrapper de fetch que añade el header Authorization automáticamente,
// leyendo el token guardado en localStorage. Úsalo para cualquier petición protegida.
export async function apiFetch(path, options = {}) {
  const usuario = JSON.parse(localStorage.getItem('usuario'))
  const token = usuario?.token

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  return fetch(`${API_URL}${path}`, { ...options, headers })
}