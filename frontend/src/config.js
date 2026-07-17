// URL base del backend, calculada según cómo se accedió al front
// Si entras desde 192.168.1.42:5173, esto genera 192.168.1.42:3156 automáticamente
export const API_URL = `http://${window.location.hostname}:3156`