import axios from 'axios';

// Vite proxies /api to http://localhost:5050 (see vite.config.js)
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('otithi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
