// Get API URL from environment variable or fallback to default
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5009';
console.log('API URL configured as:', apiUrl);

export const API_URL = apiUrl;

// Common API config
export const API_CONFIG = {
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

console.log('API Config:', API_CONFIG);

export default {
  API_URL,
  API_CONFIG
}; 